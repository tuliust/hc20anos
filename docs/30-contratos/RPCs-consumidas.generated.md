---
status: generated
owner: tuliust
last_verified: 2026-07-29
last_verified_commit: 8f021029fa55b0a3a1f22522dc2ac29064edf46a
generation_command: npm run docs:generate-rpc-usage
source_files:
  - src/
  - api/
  - supabase/functions/
  - build/
  - src/lib/rpc.types.ts
  - scripts/generate-consumed-rpc-contracts.mjs
---

# RPCs efetivamente consumidas

> Inventário gerado das chamadas `.rpc(...)` presentes no runtime e nas Functions. Não editar manualmente.

## Resumo

| Indicador | Resultado |
|---|---:|
| RPCs distintas | 61 |
| Ocorrências literais | 76 |
| Chamadas dinâmicas | 0 |

As assinaturas são derivadas de `Database["public"]["Functions"]`. O arquivo `src/lib/rpc.generated.ts` faz o TypeScript validar cada nome contra a baseline reproduzida do Supabase.

## Ocorrências

| RPC | Consumidor | Alias de argumentos | Alias de retorno |
|---|---|---|---|
| `accept_ticket_transfer` | `src/app/BuyerCommerceActions.tsx:88` | `AcceptTicketTransferArgs` | `AcceptTicketTransferReturns` |
| `admin_archive_ticket_lot` | `src/app/AdminTicketLotsMount.tsx:323` | `AdminArchiveTicketLotArgs` | `AdminArchiveTicketLotReturns` |
| `admin_clear_person_profile` | `src/adminParticipantMaintenance.ts:422` | `AdminClearPersonProfileArgs` | `AdminClearPersonProfileReturns` |
| `admin_delete_person_profile` | `src/adminParticipantMaintenance.ts:441` | `AdminDeletePersonProfileArgs` | `AdminDeletePersonProfileReturns` |
| `admin_get_person_details` | `src/lib/services.ts:551` | `AdminGetPersonDetailsArgs` | `AdminGetPersonDetailsReturns` |
| `admin_get_profile_claim_disputes_with_identity` | `build/profileClaimIdentityTransform.mjs:165` | `AdminGetProfileClaimDisputesWithIdentityArgs` | `AdminGetProfileClaimDisputesWithIdentityReturns` |
| `admin_get_ticket_lots` | `src/app/AdminTicketLotsMount.tsx:216` | `AdminGetTicketLotsArgs` | `AdminGetTicketLotsReturns` |
| `admin_get_ticket_lots` | `src/app/AdminTicketProductCopyMount.tsx:67` | `AdminGetTicketLotsArgs` | `AdminGetTicketLotsReturns` |
| `admin_import_people` | `src/lib/services.ts:508` | `AdminImportPeopleArgs` | `AdminImportPeopleReturns` |
| `admin_update_person_and_profile` | `src/lib/services.ts:564` | `AdminUpdatePersonAndProfileArgs` | `AdminUpdatePersonAndProfileReturns` |
| `admin_upsert_ticket_lot` | `src/app/AdminTicketLotsMount.tsx:289` | `AdminUpsertTicketLotArgs` | `AdminUpsertTicketLotReturns` |
| `apply_mercado_pago_payment` | `supabase/functions/payment-webhook/index.ts:196` | `ApplyMercadoPagoPaymentArgs` | `ApplyMercadoPagoPaymentReturns` |
| `calculate_refund_quote` | `src/app/BuyerCommerceActions.tsx:37` | `CalculateRefundQuoteArgs` | `CalculateRefundQuoteReturns` |
| `cancel_guest_approval_request` | `src/app/GuestApprovalPage.tsx:76` | `CancelGuestApprovalRequestArgs` | `CancelGuestApprovalRequestReturns` |
| `cancel_ticket_transfer` | `src/app/BuyerCommerceActions.tsx:91` | `CancelTicketTransferArgs` | `CancelTicketTransferReturns` |
| `claim_notification_jobs` | `supabase/functions/notification-worker/index.ts:187` | `ClaimNotificationJobsArgs` | `ClaimNotificationJobsReturns` |
| `complete_notification_job` | `supabase/functions/notification-worker/index.ts:193` | `CompleteNotificationJobArgs` | `CompleteNotificationJobReturns` |
| `complete_notification_job` | `supabase/functions/notification-worker/index.ts:197` | `CompleteNotificationJobArgs` | `CompleteNotificationJobReturns` |
| `complete_photo_removal` | `supabase/functions/photo-storage/index.ts:269` | `CompletePhotoRemovalArgs` | `CompletePhotoRemovalReturns` |
| `complete_profile_registration_v2` | `build/profileClaimIdentityTransform.mjs:143` | `CompleteProfileRegistrationV2Args` | `CompleteProfileRegistrationV2Returns` |
| `complete_profile_registration_v2` | `src/lib/services.ts:612` | `CompleteProfileRegistrationV2Args` | `CompleteProfileRegistrationV2Returns` |
| `complete_profile_registration_v3` | `build/profileClaimIdentityTransform.mjs:144` | `CompleteProfileRegistrationV3Args` | `CompleteProfileRegistrationV3Returns` |
| `create_checkout_order` | `supabase/functions/checkout-create/index.ts:335` | `CreateCheckoutOrderArgs` | `CreateCheckoutOrderReturns` |
| `create_guest_approval_request` | `src/app/GuestApprovalPage.tsx:53` | `CreateGuestApprovalRequestArgs` | `CreateGuestApprovalRequestReturns` |
| `create_uploaded_photo` | `supabase/functions/photo-storage/index.ts:166` | `CreateUploadedPhotoArgs` | `CreateUploadedPhotoReturns` |
| `export_checkin_report` | `src/app/OperationsReportingPanel.tsx:17` | `ExportCheckinReportArgs` | `ExportCheckinReportReturns` |
| `fn_increment_sold` | `supabase/functions/server/index.ts:344` | `FnIncrementSoldArgs` | `FnIncrementSoldReturns` |
| `get_admin_orders` | `src/lib/services.ts:1027` | `GetAdminOrdersArgs` | `GetAdminOrdersReturns` |
| `get_admin_refund_requests` | `src/app/OperationsPage.tsx:44` | `GetAdminRefundRequestsArgs` | `GetAdminRefundRequestsReturns` |
| `get_checkin_activity` | `src/app/OperationsReportingPanel.tsx:15` | `GetCheckinActivityArgs` | `GetCheckinActivityReturns` |
| `get_checkin_dashboard` | `src/app/OperationsPage.tsx:35` | `GetCheckinDashboardArgs` | `GetCheckinDashboardReturns` |
| `get_checkin_dashboard` | `src/app/OperationsPage.tsx:75` | `GetCheckinDashboardArgs` | `GetCheckinDashboardReturns` |
| `get_checkin_operation_metrics` | `src/app/OperationsReportingPanel.tsx:15` | `GetCheckinOperationMetricsArgs` | `GetCheckinOperationMetricsReturns` |
| `get_checkout_status_by_token` | `src/lib/checkout.ts:143` | `GetCheckoutStatusByTokenArgs` | `GetCheckoutStatusByTokenReturns` |
| `get_current_ticket_catalog` | `src/app/AdminOverviewDashboardMount.tsx:136` | `GetCurrentTicketCatalogArgs` | `GetCurrentTicketCatalogReturns` |
| `get_current_ticket_catalog` | `src/app/PublicTicketsCatalogMount.tsx:119` | `GetCurrentTicketCatalogArgs` | `GetCurrentTicketCatalogReturns` |
| `get_current_ticket_catalog` | `src/lib/currentTicketCatalog.ts:80` | `GetCurrentTicketCatalogArgs` | `GetCurrentTicketCatalogReturns` |
| `get_current_ticket_catalog` | `src/ticketsCatalogLayoutEnhancements.ts:88` | `GetCurrentTicketCatalogArgs` | `GetCurrentTicketCatalogReturns` |
| `get_event_reports` | `src/app/AdminOverviewDashboardMount.tsx:165` | `GetEventReportsArgs` | `GetEventReportsReturns` |
| `get_event_reports` | `src/lib/services.ts:1314` | `GetEventReportsArgs` | `GetEventReportsReturns` |
| `get_my_commerce_orders` | `src/app/BuyerOrdersPage.tsx:354` | `GetMyCommerceOrdersArgs` | `GetMyCommerceOrdersReturns` |
| `get_my_guest_approval_requests` | `src/app/GuestApprovalPage.tsx:37` | `GetMyGuestApprovalRequestsArgs` | `GetMyGuestApprovalRequestsReturns` |
| `get_my_ticket_transfers` | `src/app/BuyerCommerceActions.tsx:80` | `GetMyTicketTransfersArgs` | `GetMyTicketTransfersReturns` |
| `get_public_memories` | `src/lib/services.ts:1594` | `GetPublicMemoriesArgs` | `GetPublicMemoriesReturns` |
| `get_public_ticket_catalog` | `src/app/AdminOverviewDashboardMount.tsx:130` | `GetPublicTicketCatalogArgs` | `GetPublicTicketCatalogReturns` |
| `get_public_ticket_catalog` | `src/app/PublicTicketsCatalogMount.tsx:112` | `GetPublicTicketCatalogArgs` | `GetPublicTicketCatalogReturns` |
| `get_public_ticket_catalog` | `src/lib/currentTicketCatalog.ts:74` | `GetPublicTicketCatalogArgs` | `GetPublicTicketCatalogReturns` |
| `get_public_ticket_catalog` | `src/ticketsCatalogLayoutEnhancements.ts:82` | `GetPublicTicketCatalogArgs` | `GetPublicTicketCatalogReturns` |
| `has_structured_faq_items` | `src/lib/faq.ts:201` | `HasStructuredFaqItemsArgs` | `HasStructuredFaqItemsReturns` |
| `moderate_content_item` | `src/lib/services.ts:1104` | `ModerateContentItemArgs` | `ModerateContentItemReturns` |
| `moderate_content_item` | `src/lib/services.ts:1134` | `ModerateContentItemArgs` | `ModerateContentItemReturns` |
| `moderate_content_item` | `src/lib/services.ts:1551` | `ModerateContentItemArgs` | `ModerateContentItemReturns` |
| `moderate_content_item` | `src/lib/services.ts:1625` | `ModerateContentItemArgs` | `ModerateContentItemReturns` |
| `move_faq_category_items` | `src/lib/faq.ts:522` | `MoveFaqCategoryItemsArgs` | `MoveFaqCategoryItemsReturns` |
| `perform_ticket_checkin` | `src/app/OperationsPage.tsx:64` | `PerformTicketCheckinArgs` | `PerformTicketCheckinReturns` |
| `prepare_photo_removal` | `supabase/functions/photo-storage/index.ts:253` | `PreparePhotoRemovalArgs` | `PreparePhotoRemovalReturns` |
| `reject_photo_removal_request` | `src/lib/services.ts:1850` | `RejectPhotoRemovalRequestArgs` | `RejectPhotoRemovalRequestReturns` |
| `reject_ticket_transfer` | `src/app/BuyerCommerceActions.tsx:90` | `RejectTicketTransferArgs` | `RejectTicketTransferReturns` |
| `reorder_faq_categories` | `src/lib/faq.ts:508` | `ReorderFaqCategoriesArgs` | `ReorderFaqCategoriesReturns` |
| `reorder_faq_items` | `src/lib/faq.ts:492` | `ReorderFaqItemsArgs` | `ReorderFaqItemsReturns` |
| `request_order_refund` | `src/app/BuyerCommerceActions.tsx:57` | `RequestOrderRefundArgs` | `RequestOrderRefundReturns` |
| `request_ticket_resend` | `src/app/BuyerOrdersPage.tsx:383` | `RequestTicketResendArgs` | `RequestTicketResendReturns` |
| `request_ticket_transfer` | `src/app/BuyerCommerceActions.tsx:26` | `RequestTicketTransferArgs` | `RequestTicketTransferReturns` |
| `respond_guest_approval_request` | `src/app/GuestApprovalPage.tsx:69` | `RespondGuestApprovalRequestArgs` | `RespondGuestApprovalRequestReturns` |
| `restore_refunded_order_inventory` | `supabase/functions/refund-processor/index.ts:71` | `RestoreRefundedOrderInventoryArgs` | `RestoreRefundedOrderInventoryReturns` |
| `retry_order_payment` | `src/app/BuyerCommerceActions.tsx:68` | `RetryOrderPaymentArgs` | `RetryOrderPaymentReturns` |
| `review_refund_request` | `src/app/OperationsPage.tsx:103` | `ReviewRefundRequestArgs` | `ReviewRefundRequestReturns` |
| `search_external_guest_sponsors` | `src/app/GuestApprovalPage.tsx:36` | `SearchExternalGuestSponsorsArgs` | `SearchExternalGuestSponsorsReturns` |
| `set_content_featured` | `src/lib/services.ts:1580` | `SetContentFeaturedArgs` | `SetContentFeaturedReturns` |
| `set_content_featured` | `src/lib/services.ts:1631` | `SetContentFeaturedArgs` | `SetContentFeaturedReturns` |
| `set_participant_vouchers_delivered` | `src/app/OperationsPage.tsx:92` | `SetParticipantVouchersDeliveredArgs` | `SetParticipantVouchersDeliveredReturns` |
| `submit_memory` | `src/lib/services.ts:1586` | `SubmitMemoryArgs` | `SubmitMemoryReturns` |
| `submit_photo_comment` | `src/lib/services.ts:1520` | `SubmitPhotoCommentArgs` | `SubmitPhotoCommentReturns` |
| `submit_photo_removal_request` | `src/lib/services.ts:1830` | `SubmitPhotoRemovalRequestArgs` | `SubmitPhotoRemovalRequestReturns` |
| `submit_photo_tag` | `src/lib/services.ts:1140` | `SubmitPhotoTagArgs` | `SubmitPhotoTagReturns` |
| `update_my_public_profile` | `src/lib/services.ts:868` | `UpdateMyPublicProfileArgs` | `UpdateMyPublicProfileReturns` |

## Chamadas dinâmicas

| Local | Expressão |
|---|---|
| — | nenhuma chamada dinâmica detectada |

Chamadas dinâmicas impedem a validação estática completa e fazem este gerador falhar.
