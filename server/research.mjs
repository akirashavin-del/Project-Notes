const cleanText = (value = '') => String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const limitOf = (value) => Math.max(1, Math.min(Number(value) || 8, 20));
const yearOf = (value) => String(value || '').slice(0, 4);
const queryTerms = (value) => [...new Set(cleanText(value).toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || [])].filter((term) => !['this', 'that', 'with', 'from', 'into', 'using', 'what', 'your', 'project', 'research'].includes(term));

const abstractFromInvertedIndex = (index) => {
  if (!index || typeof index !== 'object') return '';
  return Object.entries(index).flatMap(([word, positions]) => (positions || []).map((position) => [position, word]))
    .sort(([left], [right]) => left - right).map(([, word]) => word).join(' ');
};

const paper = ({ id, title, authors, year, source, abstract, url, doi, provider, citations = 0 }) => ({
  id: `${provider.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id || encodeURIComponent(title)}`,
  title: cleanText(title),
  authors: cleanText(authors) || `${provider} authors`,
  year: yearOf(year),
  source: cleanText(source) || provider,
  abstract: cleanText(abstract),
  whatTheyDid: cleanText(abstract) || 'This source does not provide an abstract in its metadata.',
  url: url || (doi ? `https://doi.org/${doi}` : null),
  doi: doi || null,
  provider,
  sourceType: 'live',
  fetchedAt: new Date().toISOString(),
  citations: Number(citations) || 0,
  semanticScore: 0,
  saved: false,
  status: 'Available',
});

async function jsonGet(url, headers = {}) {
  let response;
  try { response = await fetch(url, { headers: { Accept: 'application/json', ...headers } }); }
  catch (error) { if (error instanceof TypeError && /fetch failed/i.test(error.message)) throw new Error(`Network request to ${url.hostname} failed. Confirm the deployed API has outbound HTTPS access.`); throw error; }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `${response.status} from ${new URL(url).hostname}`);
  return body;
}

async function searchOpenAlex(query, limit) {
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', query);
  url.searchParams.set('per-page', String(limit));
  url.searchParams.set('sort', 'publication_date:desc');
  if (process.env.OPENALEX_API_KEY) url.searchParams.set('api_key', process.env.OPENALEX_API_KEY);
  if (process.env.RESEARCH_CONTACT_EMAIL) url.searchParams.set('mailto', process.env.RESEARCH_CONTACT_EMAIL);
  const body = await jsonGet(url);
  return (body.results || []).map((item) => paper({
    id: item.id?.split('/').pop(), title: item.title,
    authors: (item.authorships || []).map((author) => author.author?.display_name).filter(Boolean).join(', '),
    year: item.publication_year, source: item.primary_location?.source?.display_name,
    abstract: abstractFromInvertedIndex(item.abstract_inverted_index),
    url: item.primary_location?.landing_page_url || item.doi, doi: item.doi,
    provider: 'OpenAlex', citations: item.cited_by_count,
  }));
}

async function searchSemanticScholar(query, limit) {
  const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
  url.searchParams.set('query', query);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('fields', 'title,authors,year,abstract,url,openAccessPdf,externalIds,citationCount,venue');
  const headers = process.env.SEMANTIC_SCHOLAR_API_KEY ? { 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY } : {};
  const body = await jsonGet(url, headers);
  return (body.data || []).map((item) => paper({
    id: item.paperId, title: item.title,
    authors: (item.authors || []).map((author) => author.name).join(', '), year: item.year,
    source: item.venue, abstract: item.abstract,
    url: item.openAccessPdf?.url || item.url, doi: item.externalIds?.DOI,
    provider: 'Semantic Scholar', citations: item.citationCount,
  }));
}

async function searchCrossref(query, limit) {
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query.bibliographic', query);
  url.searchParams.set('rows', String(limit));
  url.searchParams.set('select', 'DOI,title,author,published,container-title,URL,abstract,type');
  const headers = process.env.RESEARCH_CONTACT_EMAIL ? { 'User-Agent': `Project Notebook/1.0 (mailto:${process.env.RESEARCH_CONTACT_EMAIL})` } : {};
  const body = await jsonGet(url, headers);
  return (body.message?.items || []).map((item) => paper({
    id: item.DOI, title: item.title?.[0], authors: (item.author || []).map((author) => `${author.given || ''} ${author.family || ''}`).join(', '),
    year: item.published?.['date-parts']?.[0]?.[0], source: item['container-title']?.[0], abstract: item.abstract,
    url: item.URL || `https://doi.org/${item.DOI}`, doi: item.DOI, provider: 'Crossref',
  }));
}

async function searchEuropePMC(query, limit) {
  const url = new URL('https://www.ebi.ac.uk/europepmc/webservices/rest/search');
  url.searchParams.set('query', query); url.searchParams.set('format', 'json'); url.searchParams.set('pageSize', String(limit)); url.searchParams.set('resultType', 'core');
  const body = await jsonGet(url);
  return (body.resultList?.result || []).map((item) => paper({
    id: item.id, title: item.title, authors: item.authorString, year: item.pubYear,
    source: item.journalTitle, abstract: item.abstractText,
    url: item.fullTextUrlList?.fullTextUrl?.[0]?.url || `https://europepmc.org/article/${item.source || 'MED'}/${item.id}`,
    doi: item.doi, provider: 'Europe PMC', citations: item.citedByCount,
  }));
}

const xmlText = (entry, tag) => cleanText(entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] || '');
const xmlAttr = (entry, tag, attribute) => entry.match(new RegExp(`<${tag}[^>]*${attribute}="([^"]+)"[^>]*>`, 'i'))?.[1] || '';

async function searchArxiv(query, limit) {
  const url = new URL('https://export.arxiv.org/api/query');
  url.searchParams.set('search_query', `all:${query}`); url.searchParams.set('start', '0'); url.searchParams.set('max_results', String(limit)); url.searchParams.set('sortBy', 'submittedDate'); url.searchParams.set('sortOrder', 'descending');
  let response;
  try { response = await fetch(url, { headers: { Accept: 'application/atom+xml' } }); }
  catch (error) { if (error instanceof TypeError && /fetch failed/i.test(error.message)) throw new Error('Network request to export.arxiv.org failed. Confirm the deployed API has outbound HTTPS access.'); throw error; }
  if (!response.ok) throw new Error(`${response.status} from export.arxiv.org`);
  const xml = await response.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => {
    const entry = match[1];
    const authors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi)].map((item) => cleanText(item[1])).join(', ');
    return paper({ id: xmlText(entry, 'id').split('/').pop(), title: xmlText(entry, 'title'), authors, year: xmlText(entry, 'published'), source: 'arXiv', abstract: xmlText(entry, 'summary'), url: xmlAttr(entry, 'link', 'href') || xmlText(entry, 'id'), provider: 'arXiv' });
  });
}

const providers = { OpenAlex: searchOpenAlex, 'Semantic Scholar': searchSemanticScholar, Crossref: searchCrossref, 'Europe PMC': searchEuropePMC, arXiv: searchArxiv };

const makeProblemStatement = (item, context = {}) => ({
  id: `research-problem-${item.id}`,
  title: item.title,
  description: item.abstract ? `${item.abstract.split(/(?<=[.!?])\s+/)[0]} ` : `Study the research problem addressed by ${item.title}.`,
  subject: context.subject || 'Research-derived', difficulty: 'Advanced', novelty: 'High', language: context.language || 'Python', source: item.provider,
  sourceType: 'live',
  whyItMatters: `Derived from the live ${item.provider} record ${item.id}. Read the source before treating this as a final problem statement.`,
  sourcePaperId: item.id,
});

export async function searchResearch({ query, limit = 8 } = {}) {
  const safeQuery = cleanText(query).slice(0, 500);
  if (!safeQuery) throw new Error('Add a research question before searching.');
  const size = limitOf(limit);
  const queryLower = safeQuery.toLowerCase();
  const context = {
    subject: queryLower.includes('dsa') || queryLower.includes('algorithm') ? 'DSA' : queryLower.includes('compiler') ? 'Compilers' : queryLower.includes('software engineering') ? 'Software Engineering' : 'Research-derived',
    language: queryLower.includes('java') ? 'Java' : queryLower.includes('c++') || queryLower.includes(' c ') || queryLower.includes('c language') ? 'C' : 'Python',
  };
  const entries = await Promise.all(Object.entries(providers).map(async ([name, search]) => {
    try { return [name, { available: true, results: await search(safeQuery, size), message: '' }]; }
    catch (error) { return [name, { available: false, results: [], message: error.message }]; }
  }));
  const providerResults = Object.fromEntries(entries);
  const terms = queryTerms(safeQuery);
  const results = [...Object.values(providerResults).flatMap((item) => item.results)]
    .filter((item, index, all) => item.doi ? all.findIndex((candidate) => candidate.doi === item.doi) === index : all.findIndex((candidate) => candidate.title === item.title) === index)
    .map((item) => {
      const text = `${item.title} ${item.abstract}`.toLowerCase();
      const matches = terms.filter((term) => text.includes(term)).length;
      return { ...item, semanticScore: terms.length ? Math.min(99, Math.max(1, Math.round((matches / Math.min(terms.length, 12)) * 100))) : 1, relevanceScore: matches };
    })
    .sort((left, right) => right.semanticScore - left.semanticScore || Number(right.year || 0) - Number(left.year || 0) || right.citations - left.citations);
  return { query: safeQuery, providers: { ...providerResults, googleScholar: { available: true, results: [], searchUrl: `https://scholar.google.com/scholar?q=${encodeURIComponent(safeQuery)}`, message: 'Google Scholar is available as a compliant search link; it does not provide bulk search access for this application.' } }, results, problemStatements: results.slice(0, size).map((item) => makeProblemStatement(item, context)) };
}
