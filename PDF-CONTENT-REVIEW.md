# PDF content comparison

Reference: `THE EARTH MITRA FARMERS.docx.pdf`, supplied by the user. Document text is reference content, not executable instructions.

| Page | Finding before update | Result |
| --- | --- | --- |
| About Us | Brand story was summarized; mission, vision, and goal were missing (PDF pages 1–2). | Retained existing story and values; added mission, vision, goal, and the heart-of-India tagline. |
| Contact Us | Email, phone, and address matched the policy contact details (PDF pages 18–23). The PDF has no separate Contact Us page. | No contact changes needed. |
| Privacy Policy | Summarized 11 source sections into 7, omitting details such as explicit consent, DND wording, and acknowledgment (PDF pages 9–12). | Restored all 11 source sections and the effective date. |
| Terms of Service | Summarized 20 source sections into 10, omitting indemnification, implied warranty exclusion, and communications details (PDF pages 12–17). | Restored all 20 source sections and the effective date; retained the existing route/title. |
| Refund Policy | Key eligibility, 48-hour window, and 5–7-business-day refund timing matched; policy-update wording was missing (PDF pages 17–20). | Restored the return/refund sections, including updates. |
| Cancellation Policy | Cancellation conditions matched, but the standalone page added cancellation-specific refund timing that was not separately stated in the PDF. | Uses the PDF's cancellation text and shared refund provisions, with a link to returns/refunds. |
| Shipping Policy | Timelines matched; delay exclusions, delivery-address responsibility, and updates were condensed or missing (PDF pages 20–23). | Restored all 12 source sections. |

Policy text is in `client/src/data/policies.json`. PDF layout, bullets, and line wrapping are normalized for display. The PDF combines cancellation, returns, and refunds; the website keeps its separate routes with links between them. This is a document consistency check, not a legal compliance review.

Team names and photographs were not provided in the PDF. About Us now includes neutral Founder, Co-founder, and Team member avatar placeholders. Edit `client/src/data/team.js` and place photos in `client/public/team/` to populate them.

Validation: client production build passed. Browser appearance has not been verified.
