# \# Education Presentation SPA

# 

# \## Project Purpose

# 

# A lightweight, modular, CSV-driven educational presentation system for teaching Science concepts as interactive student-facing scenes.

# 

# The immediate working scope is \*\*Grade 11 Science — Nervous Coordination\*\*.

# 

# The presentation should behave like a \*\*smart teaching board\*\*, not like a normal slideshow.

# 

# Long term, the same engine should be reusable for Biology, Chemistry, Physics, Mathematics, ICT, and other curriculum areas.

# 

# \---

# 

# \# Core Design Principles

# 

# \* Student-facing presentation only

# \* CSV is the current canonical content source

# \* JavaScript renderer adapts to data; lesson content is not hard-coded in `app.js`

# \* Stable Unit → Subunit → Scene hierarchy

# \* One reusable SPA renderer for all future units

# \* Scene navigation is a directed learning graph, not a fixed slideshow

# \* `Previous` / `Next` follow configured route targets

# \* `Go Deep` can cross subunits

# \* `Up` returns to the actual origin scene through a runtime return stack, with `up\_node` as fallback

# \* Media is optional and must never crash a scene

# \* Future Filament / database CRUD must be able to replace manual CSV authoring without replacing the student SPA

# 

# \---

# 

# \# Current Technology

# 

# \* HTML

# \* CSS

# \* Vanilla JavaScript

# \* Papa Parse for CSV parsing

# \* Static local HTTP hosting during development

# \* GitHub Pages compatible

# 

# No backend is required at the current stage.

# 

# \---

# 

# \# Canonical Data / Folder Architecture

# 

# ```text

# EDUCATION\_PRESENTATION/

# │

# ├── index.html

# ├── style.css

# ├── app.js

# ├── README.md

# ├── data\_source.csv

# ├── unit\_titles.ta.csv

# ├── unit\_titles.si.csv

# │

# └── units/

# &#x20;   ├── U01\_nervous\_system/

# &#x20;       ├── unit.csv

# &#x20;       │

# &#x20;       ├── SU01\_introduction\_coordination/

# &#x20;       │   ├── subunit.csv

# &#x20;       │   └── images/

# &#x20;       │

# &#x20;       ├── SU02\_nervous\_system\_as\_system/

# &#x20;       │   ├── subunit.csv

# &#x20;       │   └── images/

# &#x20;       │

# &#x20;       ├── SU03\_neuron/

# &#x20;       │   ├── subunit.csv

# &#x20;       │   └── images/

# &#x20;       │

# &#x20;       ├── SU04\_nervous\_system\_organization/

# &#x20;       │   ├── subunit.csv

# &#x20;       │   └── images/

# &#x20;       │

# &#x20;       ├── SU05\_human\_brain/

# &#x20;       │   ├── subunit.csv

# &#x20;       │   └── images/

# &#x20;       │

# &#x20;       ├── SU06\_spinal\_cord/

# &#x20;       │   ├── subunit.csv

# &#x20;       │   └── images/

# &#x20;       │

# &#x20;       ├── SU07\_reflex\_action/

# &#x20;       │   ├── subunit.csv

# &#x20;       │   └── images/

# &#x20;       │

# &#x20;       └── SU08\_autonomic\_nervous\_system/

# &#x20;           ├── subunit.csv

# &#x20;           └── images/

# &#x20;   │

# &#x20;   └── U02\_test\_unit/

# &#x20;       ├── unit.csv

# &#x20;       ├── unit.ta.csv

# &#x20;       ├── unit.si.csv

# &#x20;       └── SU01\_test\_subunit/

# &#x20;           ├── subunit.csv

# &#x20;           ├── content.ta.csv

# &#x20;           ├── content.si.csv

# &#x20;           └── images/

# ```

# 

# \---

# 

# \# Data Responsibilities

# 

# \## `data\_source.csv`

# 

# Registry of all top-level Units.

# 

# Current example:

# 

# ```csv

# unit\_id,title,folder,display\_order,enabled

# U01,Nervous System,U01\_nervous\_system,1,1

# U02,Unit 02 — Test Unit,U02\_test\_unit,2,1

# ```

# 

# The top-level Unit UI now uses one dynamic `<select>` populated from `data\_source.csv`. Subunits remain visible as a sidebar list for the selected Unit.

# 

# \## `unit.csv`

# 

# Registry of Subunits inside one Unit.

# 

# Current U01 contains:

# 

# ```text

# SU01 Introduction to Coordination

# SU02 Nervous System as a System

# SU03 Neuron

# SU04 Organization of the Nervous System

# SU05 Human Brain

# SU06 Spinal Cord

# SU07 Reflex Action

# SU08 Autonomic Nervous System

# ```

# 

# \## `subunit.csv`

# 

# Contains the actual scene/content rows for one Subunit.

# 

# Current scene fields include:

# 

# ```text

# node\_id

# parent\_id

# node\_type

# title

# display\_order

# scene\_type

# memory\_badge

# think\_prompt

# definition

# description

# key\_points

# image\_paths

# image\_description

# interaction\_type

# interaction\_instruction

# quick\_check

# answer

# previous\_node

# next\_node

# up\_node

# down\_node

# remarks

# ```

# 

# All scene IDs should be globally unique.

# 

# \---

# 

# \# Canonical Loader Flow

# 

# ```text

# data\_source.csv

# &#x20;   ↓

# Build Unit selector

# &#x20;   ↓

# units/<unit-folder>/unit.csv

# &#x20;   ↓

# Build Subunit menu

# &#x20;   ↓

# units/<unit-folder>/<subunit-folder>/subunit.csv

# &#x20;   ↓

# Render exact scene node

# ```

# 

# Folder resolution must come from registry CSV values, not hard-coded curriculum titles.

# 

# The U02 architecture test proves that a second top-level Unit can be added through registry and CSV files without adding Unit-specific branches to `app.js`.

# 

# \---

# 

# \# Multilingual System

# 

# The current prototype supports English, Tamil, and Sinhala. English remains the base / fallback language.

# 

# Base structural and English content remains in:

# 

# ```text

# data\_source.csv

# unit.csv

# subunit.csv

# ```

# 

# Tamil and Sinhala are stored as language overlays keyed by the same stable IDs.

# 

# Top-level Unit display titles:

# 

# ```text

# unit\_titles.ta.csv

# unit\_titles.si.csv

# ```

# 

# Subunit display titles inside each Unit:

# 

# ```text

# units/<unit-folder>/unit.ta.csv

# units/<unit-folder>/unit.si.csv

# ```

# 

# Scene/content overlays inside each Subunit:

# 

# ```text

# units/<unit-folder>/<subunit-folder>/content.ta.csv

# units/<unit-folder>/<subunit-folder>/content.si.csv

# ```

# 

# Current scene overlay schema:

# 

# ```text

# node\_id

# title

# memory\_badge

# think\_prompt

# definition

# description

# key\_points

# interaction\_instruction

# quick\_check

# answer

# image\_description

# ```

# 

# Navigation and structural fields are not duplicated in translation overlays.

# 

# Language-switch rules:

# 

# \* Current Unit, Subunit, `node\_id`, and `returnStack` are preserved

# \* English uses the base row directly

# \* Tamil / Sinhala merge translated fields onto a copy of the base row using the same `node\_id`

# \* Missing or blank translated fields fall back field-by-field to English

# \* Media paths remain language-neutral at the current stage

# \* App/interface translation remains separate from curriculum translation through a JavaScript UI-label dictionary

# \* Empty or missing optional translation overlays are not permanently cached; successful non-empty overlays remain cached

# 

# Current multilingual proof status:

# 

# \* U02 test Unit: English / Tamil / Sinhala working

# \* U01 → SU01: Tamil and Sinhala content overlays created for `TU01`, `TU01\_01`, and `TU01\_02`

# \* U01 root Unit title overlays added for Tamil and Sinhala

# 

# \---

# 

# \# Scene Rendering

# 

# The active student scene is composed from CSV data rather than raw field-name cards.

# 

# Current preferred order:

# 

# ```text

# Scene Title

# ↓

# Media / Visual, only when present

# ↓

# KEY IDEA

# ↓

# THINK ABOUT THIS

# ↓

# CHECK YOURSELF

# ↓

# Reveal Answer

# ↓

# Navigation

# ```

# 

# Empty content blocks must not render empty headings or empty vertical space.

# 

# Current semantic card style:

# 

# \* KEY IDEA — light blue surface, dark blue text/border

# \* THINK ABOUT THIS — light gold surface, dark gold/brown text/border

# \* CHECK YOURSELF — light teal surface, dark teal text/border

# \* Reveal Answer — dark high-contrast button

# \* `8px` radius

# \* `2px` semantic border

# \* no shadow

# 

# \---

# 

# \# Media System

# 

# The former image holder is now a generalized \*\*16:9 media holder\*\*.

# 

# Supported media types:

# 

# ```text

# .png

# .jpg

# .jpeg

# .webp

# .svg

# .gif

# .webm

# .mp4

# ```

# 

# Rules:

# 

# \* Static images render in a 16:9 holder with `object-fit: contain`

# \* GIF is supported safely

# \* WebM / MP4 use the same 16:9 holder

# \* Video autoplay is OFF

# \* Video controls: Play / Pause / Replay

# \* Scene change stops/resets active video where safe

# \* Blank media path → render no media holder and reserve no blank space

# \* Blank path + description → render a small `VISUAL NOTE`

# \* Missing/broken media → safe placeholder with expected path / description

# \* Media failure must never prevent scene rendering or navigation

# 

# \---

# 

# \# Navigation Engine

# 

# Navigation fields are stored in `subunit.csv`:

# 

# ```text

# previous\_node

# next\_node

# up\_node

# down\_node

# ```

# 

# Behavior:

# 

# ```text

# Previous  → previous\_node

# Next      → next\_node

# Go Deep   → down\_node + push current node to returnStack

# Up        → pop returnStack; otherwise use up\_node fallback

# ```

# 

# Cross-subunit navigation is supported.

# 

# If a target node belongs to another Subunit, the app resolves the target through the registry, activates the destination Subunit, loads its CSV if required, and renders the exact target node.

# 

# Direct Unit/Subunit menu selection clears the deep-return stack and starts a new route.

# 

# Invalid navigation targets must not crash or reveal legacy content.

# 

# \---

# 

# \# Focus Mode

# 

# Focus Mode is a student/presenter view for classroom use.

# 

# When enabled:

# 

# \* Top bar hides

# \* Left sidebar hides

# \* Scene expands to the available viewport width

# \* Current scene and navigation state are preserved

# \* Bottom navigation remains available

# \* Teaching-card typography is enlarged for projector / smart-board viewing

# 

# When Focus Mode is exited, the normal shell is restored without changing the current scene.

# 

# Browser Fullscreen API is not yet part of the current milestone.

# 

# Normal-mode presentation controls are grouped as a compact right-aligned toolbar. Current controls include language selection, Focus, and View.

# 

# \---

# 

# \# Component Visibility Controls

# 

# The current scene supports temporary presentation-only hide/show controls for available components such as:

# 

# \* Scene Title

# \* Visual / Media

# \* VISUAL NOTE

# \* KEY IDEA

# \* THINK ABOUT THIS

# \* CHECK YOURSELF

# 

# Rules:

# 

# \* Hidden components collapse their space completely

# \* CSV data is not modified

# \* Navigation state is not modified

# \* Hidden video/media is paused

# \* Visibility is temporary presentation state only

# 

# \---

# 

# \# Browser Verification Policy

# 

# Automated Playwright / Chromium installation is \*\*not required\*\* for every development step.

# 

# For the current prototype:

# 

# \* Code changes may be syntax-checked and structurally verified

# \* The user will perform final visual/browser verification manually

# \* Do not install Playwright browsers or large test dependencies unless explicitly requested

# 

# \---

# 

# \# Current Curriculum Scope

# 

# \## Unit — Nervous System

# 

# \### SU01 — Introduction to Coordination

# 

# \### SU02 — Nervous System as a System

# 

# \* Need / role of the nervous system

# \* Nervous system as an information-processing system

# \* Input → Processing → Output

# \* Receptor → Nervous system → Effector

# 

# \### SU03 — Neuron

# 

# \* Structural unit

# \* Main parts

# \* Structure ↔ function

# \* Sensory neuron

# \* Motor neuron

# \* Interneuron

# \* Comparison

# 

# \### SU04 — Organization of the Nervous System

# 

# \* CNS

# \* PNS

# \* Brain

# \* Spinal cord

# \* Cranial nerves

# \* Spinal nerves

# 

# \### SU05 — Human Brain

# 

# \### SU06 — Spinal Cord

# 

# \### SU07 — Reflex Action

# 

# \### SU08 — Autonomic Nervous System

# 

# \---

# 

# \# Milestones

# 

# \## M0 — Concept \& Pedagogy

# 

# \* \[x] Smart teaching-board concept

# \* \[x] Student-facing presentation principle

# \* \[x] Concept-first teaching hierarchy

# \* \[x] Input → Processing → Output model

# \* \[x] Surface / deep learning model

# \* \[x] Nervous Coordination scope established

# 

# \*\*Status: COMPLETE\*\*

# 

# \---

# 

# \## M1 — Prototype UI

# 

# \* \[x] Static SPA prototype

# \* \[x] Student scene area

# \* \[x] Sidebar concept proven

# \* \[x] Reveal interaction

# \* \[x] Responsive base layout

# \* \[x] Teacher-facing clutter removed

# 

# \*\*Status: COMPLETE\*\*

# 

# \---

# 

# \## M2 — Canonical Hierarchy

# 

# \* \[x] Unit defined

# \* \[x] Subunit defined

# \* \[x] Scene/content row defined

# \* \[x] Stable IDs established

# \* \[x] U01 + SU01–SU08 hierarchy established

# 

# \*\*Status: COMPLETE\*\*

# 

# \---

# 

# \## M3 — CSV Architecture

# 

# \* \[x] CSV selected as current source

# \* \[x] Papa Parse selected

# \* \[x] Root Unit registry defined

# \* \[x] Unit-local Subunit registry defined

# \* \[x] Subunit-local scene CSV defined

# \* \[x] Relative media paths defined

# 

# \*\*Status: COMPLETE\*\*

# 

# \---

# 

# \## M4 — Modular Folder Architecture

# 

# \* \[x] `data\_source.csv` root registry

# \* \[x] `units/<unit>/unit.csv`

# \* \[x] one folder per Subunit

# \* \[x] `subunit.csv` per Subunit

# \* \[x] `images/` per Subunit

# \* \[x] future CRUD compatibility retained

# 

# \*\*Status: COMPLETE\*\*

# 

# \---

# 

# \## M5 — Dynamic Loader

# 

# \* \[x] Load `data\_source.csv`

# \* \[x] Build Unit selector dynamically

# \* \[x] Load selected Unit's `unit.csv`

# \* \[x] Build Subunit menu dynamically

# \* \[x] Load selected `subunit.csv`

# \* \[x] Resolve folders from registry values

# \* \[x] Active Unit/Subunit state

# \* \[x] Error-safe CSV loading

# \* \[x] Prove second top-level Unit loading with U02 test Unit and no Unit-specific `app.js` branch

# 

# \*\*Status: COMPLETE / LOCKED\*\*

# 

# \---

# 

# \## M6 — Dynamic Scene Renderer

# 

# \* \[x] CSV-driven teaching-card renderer

# \* \[x] Scene title

# \* \[x] KEY IDEA

# \* \[x] THINK ABOUT THIS

# \* \[x] CHECK YOURSELF

# \* \[x] Reveal Answer

# \* \[x] Empty-block suppression

# \* \[x] 16:9 media holder

# \* \[x] Blank-media safety

# \* \[x] Missing-media fallback

# \* \[x] GIF support

# \* \[x] WebM / MP4 support with Play / Pause / Replay

# 

# \*\*Status: IMPLEMENTED — FINAL MANUAL MEDIA TESTING MAY CONTINUE\*\*

# 

# \---

# 

# \## M7 — Navigation Engine

# 

# \* \[x] Previous

# \* \[x] Next

# \* \[x] Go Deep

# \* \[x] Up

# \* \[x] returnStack actual-origin behavior

# \* \[x] cross-subunit target resolution

# \* \[x] direct-menu stack reset

# \* \[x] invalid-target safety

# \* \[x] blank-image navigation safety

# 

# \*\*Status: COMPLETE\*\*

# 

# \---

# 

# \## M8 — Presentation Controls

# 

# \* \[x] Focus Mode

# \* \[x] Enlarged Focus Mode typography

# \* \[x] Component hide/show menu

# \* \[x] Hidden media pause behavior

# \* \[x] Dynamic Unit selector UI

# \* \[x] Flat aligned Focus/View toolbar controls

# \* \[ ] Bottom-navigation overlap — final manual visual confirmation / adjustment

# \* \[ ] Browser fullscreen

# 

# \*\*Status: IN PROGRESS\*\*

# 

# \---

# 

# \## M9 — Multilingual Foundation

# 

# \* \[x] English / Tamil / Sinhala language selector

# \* \[x] Separate UI-label translation dictionary

# \* \[x] Root Unit title overlays

# \* \[x] Unit-local Subunit title overlays

# \* \[x] Subunit-local scene content overlays

# \* \[x] Field-by-field English fallback

# \* \[x] Preserve Unit / Subunit / node / returnStack state on language switch

# \* \[x] Avoid permanent negative-cache entries for missing overlays

# \* \[x] U02 multilingual prototype verified

# \* \[x] U01 → SU01 Tamil/Sinhala overlays created

# \* \[ ] Expand reviewed Tamil/Sinhala content to remaining U01 Subunits

# 

# \*\*Status: ACTIVE / FOUNDATION COMPLETE\*\*

# 

# \---

# 

# \## M10 — Edit \& Export

# 

# \* \[ ] Edit current scene

# \* \[ ] LocalStorage override

# \* \[ ] Reset to CSV

# \* \[ ] Export complete JSON

# 

# \*\*Status: PENDING\*\*

# 

# \---

# 

# \## M11 — Content Development

# 

# \* \[x] Initial SU01 / SU02 teaching content available

# \* \[ ] Refine SU01 route/content

# \* \[ ] Refine SU02 route/content

# \* \[ ] Complete SU03 Neuron

# \* \[ ] Complete SU04 Organization

# \* \[ ] Complete SU05 Human Brain

# \* \[ ] Complete SU06 Spinal Cord

# \* \[ ] Complete SU07 Reflex Action

# \* \[ ] Complete SU08 Autonomic Nervous System

# \* \[ ] Replace test navigation links with final pedagogical routes where required

# 

# \*\*Status: ACTIVE\*\*

# 

# \---

# 

# \## M12 — Deployment

# 

# \* \[ ] Final local manual browser check

# \* \[ ] Git repository cleanup

# \* \[ ] Push project

# \* \[ ] Enable GitHub Pages

# \* \[ ] Verify CSV/media paths online

# 

# \*\*Status: PENDING\*\*

# 

# \---

# 

# \# Immediate Next Task

# 

# Continue the multilingual rollout one Subunit at a time. First manually verify U01 → SU01 in Tamil and Sinhala across `TU01`, `TU01\_01`, and `TU01\_02`. After that, expand reviewed Tamil/Sinhala overlays to the next Subunit only.

# 

# Presentation-control enhancements such as browser fullscreen and further visual polish remain later tasks unless explicitly prioritized.

# 

# \---

# 

# \# Current Development Rule

# 

# Architecture and rendering logic are now substantially reusable.

# 

# From this point:

# 

# ```text

# Data / Content

# &#x20;   ↓

# Subunit CSV

# &#x20;   +

# Optional Tamil / Sinhala Overlay

# &#x20;   ↓

# Reusable Renderer

# &#x20;   ↓

# Navigation Graph

# &#x20;   ↓

# Focus Presentation

# ```

# 

# Prefer tightly scoped changes. Do not reintroduce legacy static scenes or hard-coded curriculum content.



