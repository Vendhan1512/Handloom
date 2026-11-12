# Handloom Domain Business Rules & Operational Policies (docs/BUSINESS_RULES.md)

## 1. Core Operating Principles

In handloom manufacturing and cooperative society administration, operational state transitions represent physical handoffs of high-value natural fibers (silk, zari, fine cotton) and human labor. The platform strictly enforces the following non-negotiable principles:

1. **Material Issue Is Not Material Consumption:** Issuing yarn to a pre-loom processor or weaver transfers physical custody; it does not consume inventory. Inventory is only consumed upon verified cut-piece production and reconciliation.
2. **Worker Assignment Is Not Production Completion:** Allocating a loom or issuing a job card does not guarantee finished goods.
3. **Reported Production Is Not Quality Acceptance:** Self-reported cuts by a weaver must undergo independent quality inspection before being added to finished goods inventory.
4. **Quality Acceptance Is Not Delivery:** Quality approval marks goods ready for dispatch; customer ownership transfers only upon physical gate dispatch and delivery receipt.
5. **Approved Wages Are Not Completed Payments:** Wage calculations approved by a supervisor create an accounts payable liability. They become paid only upon verified cash disbursement or bank transfer settlement.
6. **Continuous Custody Across Cycles:** Weavers and pre-loom workers frequently hold yarn custody across multiple accounting weeks. Outstanding custody must be tracked continuously until reconciled.
7. **Explicit Scrap, Loss & Waste Recording:** Pre-loom winding loss, sizing loss, loom waste, and loom-remnant warp sheets must be recorded with verified weights and percentages.
8. **Immutability of Financial & Inventory Ledgers:** Ledger records cannot be updated or deleted. Any corrections require compensating reversal or adjustment records.

---

## 2. End-to-End Handloom Lifecycle Rules

### Rule 1: Customer Order Intake & Lifecycle

- Orders must specify product SKU, colorway, dimensions (length/width), reed/pick specification, quantity (pieces or running meters), target delivery date, and contracted unit price.
- Orders transition: `DRAFT → CONFIRMED → MATERIAL_ALLOCATED → IN_PRODUCTION → INSPECTED → PACKED → DISPATCHED → DELIVERED → CLOSED`.
- An order cannot transition to `IN_PRODUCTION` until full warp and weft yarn requirements have been verified against available stock or linked purchase orders.

### Rule 2: Product & Weave Specifications

- Every product must define:
  - **Reed Count:** Ends per inch across the warp width (e.g., 80, 100, 120 reed).
  - **Pick Count:** Picks per inch inserted by the shuttle along the weft (e.g., 84, 96 picks).
  - **Warp Total Ends:** Calculated as `Width in Inches × Reed Count` (+ extra selvedge ends).
  - **Bill of Materials (BOM):** Exact fiber counts (e.g., Mulberry Silk 20/22D, Cotton 2/120s), ply, and expected grams per finished unit.
  - **Wastage Tolerance:** Standard tolerance (typically 2.5% to 5.0%) for pre-loom winding and loom shed loss.

### Rule 3: Yarn Procurement & Receipt

- Procurement requires: Supplier details, invoice number, purchase date, declared count/ply, net received weight (in kg), and unit cost.
- Upon receipt, yarn must be assigned a unique **Yarn Lot Number**.
- Weight verification: Physical weight must be verified at society weigh scales before entry into the stock ledger. Discrepancies between invoice weight and scale weight must generate a debit note alert.

### Rule 4: Material Lot Tracking & FIFO Allocation

- Every yarn spool, hank, or cone belongs to an immutable Lot.
- Material allocation for warp preparation follows **First-In, First-Out (FIFO)** to prevent fiber aging, tensile degradation, and dye-lot variations across matching fabric runs.

### Rule 5: Bobbin & Pirn Winding

- Raw hank yarn is wound onto bobbins (for warping) or pirns (for shuttles).
- Input weight (raw hanks) vs. output weight (wound bobbins) must be recorded.
- **Winding Loss:** Measured in grams and percentage. Losses exceeding the configured tolerance (e.g., > 1.5%) require supervisor review.

### Rule 6: Warping Process

- Warp yarns from bobbins are wound onto a warping drum or warping mill to prepare continuous warp sheets.
- Specification tracks: Total warp length (meters), total ends, number of sections, and color repeat sequence.
- Warping breakage frequency must be logged to assess yarn tensile quality.

### Rule 7: Beaming

- The prepared warp sheet is transferred under uniform tension onto the weaver's warp beam.
- The beam must be assigned a unique **Beam ID** tagged with total warp length, ends count, and target product SKU.

### Rule 8: Sizing (Dressing)

- Natural starch/paste (rice starch, sago, or tamarind seed paste) is applied to strengthen warp yarns against abrasion during shedding.
- Net gain or moisture variance must be stabilized before mounting on the loom.

### Rule 9: Hank & Yarn Dyeing

- When yarn is dyed in-house or sent to external dye houses, the batch must track dye-stuff, shade code, chemical recipe, and wet vs. dry weight.
- Bleeding and color-fastness tests must pass before winding.

### Rule 10: Weaver & Loom Assignment

- Weavers are assigned to specific looms based on skill grade (e.g., Jacquard Silk Saree, Plain Cotton Dhoti).
- A **Loom Card / Job Card** is issued linking: Weaver ID, Loom Number, Warp Beam ID, and target piece count.
- Maximum concurrent custody limits apply: A weaver cannot be issued fresh warp beams if previous incomplete beams remain unverified past the cycle threshold.

### Rule 11: Material Transportation & Distribution

- Movement of warp beams or yarn from society central stores to village weaver cottages or external warping facilities requires a **Material Gate Pass**.
- Signatures/biometrics of the transporter and receiver must be recorded upon physical handover.

### Rule 12: Production Monitoring & Web Progression

- Progress is logged periodically in meters woven.
- Warp length reduction is calculated based on pick density and take-up crimp (typically 6%–10% crimp contraction).

### Rule 13: Material Consumption & Cut-Piece Delivery

- When a weaver cuts a woven piece (e.g., single saree or running piece):
  - Cut length (meters) and gross piece weight (grams) are measured at the society depot.
  - Theoretical yarn consumption is calculated from the BOM and deducted from the weaver's active custody balance.

### Rule 14: Material Returns & Waste Reconciliation

- When a warp beam finishes:
  - Remnant thrum waste (unwoven warp ends tied to the beam) and leftover weft pirns must be returned to stores.
  - **Reconciliation Formula:**
    $$\text{Total Issued} = \text{Finished Goods Weight} + \text{Returned Unused Yarn} + \text{Allowable Loom Waste} + \text{Unaccounted Shortage}$$
  - Unaccounted shortage exceeding allowable thresholds is flagged for wage recovery.

### Rule 15: Quality Inspection & Grading

- Finished pieces undergo master inspection on an inspection table:
  - Parameters: Dimensions (width/length), reed/pick consistency, slubs, broken ends, dye patchiness, zari tarnishing, and border alignment.
  - Grades: **Grade A** (Pass / Full Price), **Grade B** (Minor Blemish / Commercial Discount), **Grade C / Rejection** (Severe Defect).

### Rule 16: Defect Management & The Half-Rate Damage Policy

- **Minor Defect Rework:** If a blemish can be rectified (e.g., dry cleaning, loose thread trimming, mending), a rework slip is generated.
- **The Half-Rate Damage Rule:**
  - For pieces exhibiting structural weaving defects (uneven beat-up, mispicks, oil stains caused by weaver negligence), standard operating practice in many cooperatives pays the weaver **50% of the normal piece rate** for the damaged yardage, subject to supervisor authorization.
  - _Policy Status:_ **UNRESOLVED POLICY CONFIRMATION REQUIRED.** The specific damage categories qualifying for half-rate payment vs. zero payment vs. material penalty must be formally configured per tenant.

### Rule 17: Finishing, Packaging & Delivery

- Approved pieces receive iron pressing, folding, tagging (Silk Mark / Handloom Mark certification, QR code), and protective moisture-proof packing.
- Dispatched with a Delivery Challan and Sales Invoice.

### Rule 18: Worker Piece-Rate Wages

- Wages are primarily determined on a **piece-rate basis** (e.g., ₹ per saree, ₹ per meter woven, or ₹ per 1,000 picks for complex Jacquard).
- Piece rate scales vary by design complexity (e.g., Korvai borders, Kadhuwa motifs).

### Rule 19: Worker Advances & Recovery

- Weavers frequently take seasonal or festival advances (interest-free loans against future labor).
- Advance deductions are capped at a configurable percentage (e.g., maximum 20% to 30%) of gross weekly piece-rate earnings to protect artisan subsistence livelihoods.

### Rule 20: Supplier Payables & Payments

- Yarn suppliers are credited upon Quality Approval of received lots.
- Payments follow commercial terms (e.g., 30-day net credit) with tracking of GST, TDS, and invoice adjustments.

### Rule 21: Customer Receivables & Settlement

- Invoicing on dispatch. Partial advances against bulk orders are tracked as unearned liabilities until delivery challan sign-off.

### Rule 22: Costing & Profitability Analysis

- Realized unit cost accounts for:
  $$\text{Unit Cost} = \text{Actual Yarn Consumed (Warp + Weft + Zari)} + \text{Pre-Loom Processing Costs} + \text{Weaving Piece Wage} + \text{Finishing Costs} + \text{Allocated Overhead}$$
- Actual cost must be reconciled against standard costing to detect fiber consumption variances.

---

## 3. Unresolved Business Decisions Requiring Stakeholder Confirmation

| Item ID     | Topic                             | Current State                                              | Required Decision                                                                                        |
| :---------- | :-------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| **DEC-001** | Half-Rate Damage Deduction Policy | Currently documented as 50% piece rate for damaged meters. | Confirm exact defect classification triggering half-rate vs. full recovery of yarn cost from weaver.     |
| **DEC-002** | Weaver Advance Recovery Caps      | Default assumed at 25% of gross earnings per settlement.   | Confirm maximum legally and socially acceptable weekly deduction percentage.                             |
| **DEC-003** | Silk Mark & Handloom Mark Tagging | Workflow step documented.                                  | Determine whether digital certificate generation and government portal synchronization are required.     |
| **DEC-004** | Scrap & Thrum Waste Valuation     | Recorded as weight in kg.                                  | Determine whether scrap yarn is resold at salvage rates and how salvage proceeds offset cost of goods.   |
| **DEC-005** | Multi-Weaver Single Beam Handoff  | Documented as single weaver assignment.                    | Formulate policy when an artisan falls ill and another completes the remaining 30 meters of a warp beam. |

---

## 4. Workforce, Organization & Operational Identity Governance Rules

### Rule 23: Operational Artisan Identity vs System Operators
- Operational craftspeople (weavers, winders, sizers, beamers) are managed as `Worker` entities and do not require digital system user accounts (`User`), email addresses, or smartphones.
- Creating a worker record assigns a unique operational `workerCode` scoped to the cooperative or mill tenant.
- Worker records track physical operational attributes: government/cooperative registration, artisan card number, bank details for wage disbursements, and skill proficiencies.

### Rule 24: Multi-Skilled Artisan Capabilities
- Artisans frequently possess skills spanning multiple pre-loom and weaving processes (e.g., Korvai weaving, Jacquard setting, Bobbin winding).
- The platform tracks skill relationships via `WorkerSkill` with proficiency ratings (`BEGINNER`, `INTERMEDIATE`, `EXPERT`, `MASTER_CRAFTSPERSON`) and verified years of experience.
- Primary skills govern default task suitability, but multi-skilled workers may be assigned across different stages as operational demand shifts.

### Rule 25: Organization Safety & Last-Owner Invariant
- An organization (`Tenant`) must maintain at least one active user with the `OWNER` role at all times.
- The platform strictly forbids deactivating, demoting, or deleting the sole active `OWNER` of an organization.
- Self-elevation or arbitrary role promotion is restricted: an operator cannot assign roles or permissions exceeding their own role hierarchy.

### Rule 26: Worker Assignment Boundary
- A `WorkerAssignment` tracks the operational allocation of a worker to a task, craft process, or workstation.
- **Assignment is NOT production completion:** Assigning an artisan creates an operational tracking state; it does not record finished fabric, yarn consumption, or wage accrual.
- Cross-tenant assignment defense: A worker cannot be assigned to tasks belonging to a different organization under any circumstance. Multi-tenant boundaries are enforced at both database (RLS) and API service layers.
