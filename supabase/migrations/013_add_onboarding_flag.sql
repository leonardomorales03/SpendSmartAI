-- Agregar columna has_completed_onboarding a user_settings
alter table user_settings add column has_completed_onboarding boolean default false;
