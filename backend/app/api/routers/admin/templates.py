from fastapi import APIRouter

router = APIRouter(prefix="/admin/templates", tags=["admin:templates"])

# TODO — authoring side of the marketplace.
#
#   POST   /admin/templates                      -> TemplateRead  201  (TemplateCreate)
#   PATCH  /admin/templates/{template_id}        -> TemplateRead       (TemplateUpdate)
#   DELETE /admin/templates/{template_id}        -> 204
#          weddings.template_id has no ON DELETE, so this fails while any
#          invitation uses the design. Prefer is_active=False — it hides the
#          template from the marketplace without breaking live invitations.
#
#   Section definitions (template_content):
#   GET    /admin/templates/{template_id}/contents            -> list[TemplateContentRead]
#   PUT    /admin/templates/{template_id}/contents            -> list[TemplateContentRead]
#          Replace the whole set in one call; unique on (template_id, section_key).
#          Editing these does not retro-fit weddings already created from the
#          template — existing wedding_sections keep whatever they were seeded with.
#
#   Categories:
#   POST   /admin/templates/categories           -> TemplateCategoryRead
#   PATCH  /admin/templates/categories/{id}      -> TemplateCategoryRead
#
# Write an AdminActivityLog row for every mutation here.
