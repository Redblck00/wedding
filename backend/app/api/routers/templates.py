from fastapi import APIRouter

router = APIRouter(prefix="/templates", tags=["templates"])

# TODO — marketplace (read-only for users; authoring lives in routers/admin/templates.py):
#   GET  /templates/categories      -> list[TemplateCategoryRead]
#   GET  /templates                 -> list[TemplateRead]     filters: category_id, is_free
#                                      must exclude is_active=False rows
#   GET  /templates/{template_id}   -> TemplateDetailRead     includes `contents`
#   POST /templates/{template_id}/acquire -> UserTemplateRead
#        only when templates.is_free — a paid template is unlocked by
#        payment_service after the provider webhook confirms, never here.
#
# Route order matters: declare /categories before /{template_id}, otherwise
# "categories" is captured as a template_id and fails UUID parsing.
