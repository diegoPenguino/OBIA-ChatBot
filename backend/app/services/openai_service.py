"""OpenAI service — handles token counting and API calls."""

import tiktoken
from openai import OpenAI
from app.config import get_settings

settings = get_settings()

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def count_tokens(text: str, model: str | None = None) -> int:
    """Count tokens for a given text using tiktoken."""
    model = model or settings.OPENAI_MODEL
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))


def generate_response(user_prompt: str) -> dict:
    """
    Send a stateless request to OpenAI.

    Returns dict with keys: response, input_tokens, output_tokens.
    Raises ValueError if input token limit is exceeded.
    """
    system_prompt = settings.SYSTEM_PROMPT

    # Count input tokens (system + user prompt)
    print(f"User prompt: {user_prompt}")
    print(f"Input tokens: {count_tokens(user_prompt)}")
    
    input_tokens = count_tokens(user_prompt)

    if input_tokens > settings.MAX_INPUT_TOKENS:
        raise ValueError(
            f"Input exceeds token limit: {input_tokens}/{settings.MAX_INPUT_TOKENS} tokens. "
            "Please shorten your message."
        )

    completion = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=settings.OPENAI_TEMPERATURE,
        max_tokens=settings.MAX_OUTPUT_TOKENS,
    )

    response_text = completion.choices[0].message.content or ""
    output_tokens = completion.usage.completion_tokens if completion.usage else 0
    actual_input = input_tokens

    return {
        "response": response_text,
        "input_tokens": actual_input,
        "output_tokens": output_tokens,
    }
