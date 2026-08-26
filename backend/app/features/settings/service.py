from uuid import UUID

from app.features.settings.registry import SETTING_DEFINITIONS
from app.features.settings.repository import SettingRepository
from app.features.settings.schemas import SettingsPayload, SettingsUpdateRequest
from app.models.setting import Setting


class SettingService:
    def __init__(self, repository: SettingRepository) -> None:
        self.repository = repository

    def get_settings(self, *, public_only: bool) -> SettingsPayload:
        values = {
            key: definition.default
            for key, definition in SETTING_DEFINITIONS.items()
            if not public_only or definition.is_public
        }
        values.update(
            {
                setting.key: setting.value
                for setting in self.repository.list_settings(public_only=public_only)
                if setting.key in SETTING_DEFINITIONS
            }
        )
        return SettingsPayload.model_validate(values)

    def update_settings(self, payload: SettingsUpdateRequest, actor_id: UUID) -> SettingsPayload:
        values = payload.model_dump(exclude_unset=True, mode="json")
        for key, value in values.items():
            definition = SETTING_DEFINITIONS[key]
            setting = self.repository.get_by_key(key)
            if setting is None:
                setting = Setting(
                    key=key,
                    value=value,
                    scope=definition.scope,
                    description=definition.description,
                    is_public=definition.is_public,
                    created_by_id=actor_id,
                    updated_by_id=actor_id,
                )
                self.repository.add(setting)
            else:
                setting.value = value
                setting.updated_by_id = actor_id
        self.repository.db.commit()
        return self.get_settings(public_only=False)
