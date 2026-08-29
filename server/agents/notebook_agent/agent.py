import os

from google.adk.agents import Agent


TASKS = {
    "interpret_idea": "Translate the idea into a small editable project definition.",
    "summarize_source": "Explain what the source actually did, its useful method, and its limits.",
    "explain_code": "Explain the selected code in project context and at the learner's level.",
    "explain_build_error": "Turn the compiler diagnostic into cause, evidence, and next action.",
    "generate_code": "Generate a small, relevant, compilable multi-file project stack from the verified project definition.",
    "generate_ui": "Generate a practical, accessible interface plan from the verified project inputs and outputs.",
    "write_notes": "Create short human-readable notes from verified project facts.",
    "write_slides": "Create a concise presentation outline from verified project facts and results.",
}

root_agent = Agent(
    name="notebook_semantic_worker",
    model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
    description="Bounded semantic worker for the Project Notebook.",
    instruction=(
        "Read the JSON message with task, project, and input. "
        "The allowed task descriptions are: " + str(TASKS) + ". "
        "Use only facts in the supplied JSON. Do not invent results, citations, metrics, compiler facts, or files. "
        "For generate_code return exactly {files:[{path,language,role,content}]} with 2-5 small files, one runnable entry file, and no external dependencies unless supplied. "
        "For generate_ui return exactly {title, screens:[{name,purpose,fields:[string],actions:[string]}], flow:[string]}. Keep it practical, accessible, and grounded in the supplied project. "
        "For every other task return exactly one JSON object with short plain-language fields. If information is missing, say so instead of guessing."
    ),
)
