"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import semantic_kernel as sk

from .prompt_template import PromptTemplate


def generate_sk_prompt_template_config(prompt_template: PromptTemplate) -> sk.PromptTemplateConfig:
    return sk.PromptTemplateConfig(
        schema=prompt_template.config.schema,
        type=prompt_template.config.type,
        description=prompt_template.config.description,
        default_services=prompt_template.config.default_backends,
        completion=sk.PromptTemplateConfig.CompletionConfig(
            temperature=prompt_template.config.completion.temperature,
            top_p=prompt_template.config.completion.top_p,
            presence_penalty=prompt_template.config.completion.presence_penalty,
            frequency_penalty=prompt_template.config.completion.frequency_penalty,
            max_tokens=prompt_template.config.completion.max_tokens,
            stop_sequences=prompt_template.config.completion.stop_sequences,
            # TODO: support number_of_responses?
        )
        # TODO: support input?
    )
