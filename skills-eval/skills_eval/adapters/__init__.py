from skills_eval.adapters.base import SkillAdapter
from skills_eval.adapters.command import CommandAdapter
from skills_eval.adapters.mock import MockAdapter
from skills_eval.models import SkillConfig


def build_adapter(skill: SkillConfig) -> SkillAdapter:
    if skill.type == "command":
        return CommandAdapter(skill)
    if skill.type == "mock":
        return MockAdapter(skill)
    raise ValueError(f"Unsupported skill type: {skill.type}")
