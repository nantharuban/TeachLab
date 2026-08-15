/* ============================================================
   Science Teaching Core — Nervous Coordination
  Student-facing content is loaded from the Unit/Subunit CSV hierarchy.
   ============================================================ */

const STORAGE_KEY = "ntc_nervous_coordination_scenes_v1";
const UNIT_REGISTRY_PATH = "data_source.csv";
const TRANSLATABLE_FIELDS = [
  "title",
  "memory_badge",
  "think_prompt",
  "definition",
  "description",
  "key_points",
  "interaction_instruction",
  "quick_check",
  "answer",
  "image_description"
];
const UI_LABELS = {
  en: {
    unit: "Unit",
    subunits: "Subunits",
    previous: "Previous",
    next: "Next",
    up: "Up",
    goDeep: "Go Deep",
    enterFocus: "Enter Focus",
    exitFocus: "Exit Focus",
    view: "View",
    keyIdea: "KEY IDEA",
    thinkAboutThis: "THINK ABOUT THIS",
    checkYourself: "CHECK YOURSELF",
    revealAnswer: "Reveal answer",
    hideAnswer: "Hide answer",
    visualNote: "VISUAL NOTE",
    mediaUnavailable: "Media unavailable"
  },
  ta: {
    unit: "அலகு",
    subunits: "துணை அலகுகள்",
    previous: "முந்தைய",
    next: "அடுத்தது",
    up: "மேலே",
    goDeep: "ஆழமாக செல்",
    enterFocus: "கவன நிலை",
    exitFocus: "வெளியேறு",
    view: "காட்சி",
    keyIdea: "முக்கிய கருத்து",
    thinkAboutThis: "இதைக் சிந்திக்கவும்",
    checkYourself: "சரிபார்க்கவும்",
    revealAnswer: "விடையை காட்டு",
    hideAnswer: "விடையை மறை",
    visualNote: "காட்சி குறிப்பு",
    mediaUnavailable: "ஊடகம் இல்லை"
  },
  si: {
    unit: "ඒකකය",
    subunits: "උප ඒකක",
    previous: "පෙර",
    next: "ඊළඟ",
    up: "ඉහළට",
    goDeep: "ගැඹුරට යන්න",
    enterFocus: "අවධානය",
    exitFocus: "පිටවන්න",
    view: "දර්ශනය",
    keyIdea: "ප්‍රධාන අදහස",
    thinkAboutThis: "මේ ගැන සිතන්න",
    checkYourself: "ඔබම පරීක්ෂා කරන්න",
    revealAnswer: "පිළිතුර පෙන්වන්න",
    hideAnswer: "පිළිතුර සඟවන්න",
    visualNote: "දෘශ්‍ය සටහන",
    mediaUnavailable: "මාධ්‍ය නොමැත"
  }
};

const UnitLoader = {
  registry: [],
  enabledUnits: [],
  unitRows: {},
  subunitRows: {},
  contentOverlays: {},
  unitTitleOverlays: {},
  subunitTitleOverlays: {},
  nodeIndex: new Map(),
  returnStack: [],
  activeUnitId: null,
  activeSubunitId: null,
  activeNodeId: null,
  activeLanguage: "en",
  errorBox: null,
  loadToken: 0,
  focusMode: false,
  componentState: {},

  init() {
    this.errorBox = document.getElementById("unitLoaderPanel");
    this.updateStaticUiLabels();
    this.loadRegistry();
  },

  t(key) {
    const language = UI_LABELS[this.activeLanguage] ? this.activeLanguage : "en";
    return (UI_LABELS[language] && UI_LABELS[language][key]) || UI_LABELS.en[key] || key;
  },

  parseCsvText(csvText) {
    return Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim()
    });
  },

  loadOptionalCsv(path) {
    return fetch(path, { cache: "no-store" })
      .then(response => {
        if (!response.ok) return [];
        return response.text();
      })
      .then(csvText => {
        if (Array.isArray(csvText)) return csvText;
        const parsed = this.parseCsvText(csvText);
        if (parsed.errors && parsed.errors.length) {
          console.warn("Optional language CSV could not be parsed:", path, parsed.errors[0]);
          return [];
        }
        return parsed.data || [];
      })
      .catch(error => {
        console.warn("Optional language CSV could not be loaded:", path, error);
        return [];
      });
  },

  indexRowsById(rows, idField) {
    const map = {};
    (rows || []).forEach(row => {
      const id = String(row[idField] || "").trim();
      if (id) map[id] = row;
    });
    return map;
  },

  loadUnitTitleOverlay(language = this.activeLanguage) {
    if (language === "en") return Promise.resolve({});
    if (this.unitTitleOverlays[language]) return Promise.resolve(this.unitTitleOverlays[language]);

    return this.loadOptionalCsv("unit_titles." + language + ".csv")
      .then(rows => {
        const map = this.indexRowsById(rows, "unit_id");
        if (Object.keys(map).length) {
          this.unitTitleOverlays[language] = map;
        }
        return map;
      });
  },

  loadSubunitTitleOverlay(unit, language = this.activeLanguage) {
    if (!unit || language === "en") return Promise.resolve({});
    const key = unit.unit_id + ":" + language;
    if (this.subunitTitleOverlays[key]) return Promise.resolve(this.subunitTitleOverlays[key]);

    return this.loadOptionalCsv("units/" + unit.folder + "/unit." + language + ".csv")
      .then(rows => {
        const map = this.indexRowsById(rows, "subunit_id");
        if (Object.keys(map).length) {
          this.subunitTitleOverlays[key] = map;
        }
        return map;
      });
  },

  loadContentOverlay(unit, subunit, language = this.activeLanguage) {
    if (!unit || !subunit || language === "en") return Promise.resolve({});
    const key = unit.unit_id + ":" + subunit.subunit_id + ":" + language;
    if (this.contentOverlays[key]) return Promise.resolve(this.contentOverlays[key]);

    return this.loadOptionalCsv("units/" + unit.folder + "/" + subunit.folder + "/content." + language + ".csv")
      .then(rows => {
        const map = this.indexRowsById(rows, "node_id");
        if (Object.keys(map).length) {
          this.contentOverlays[key] = map;
        }
        return map;
      });
  },

  getUnitDisplayTitle(unit) {
    if (!unit) return "";
    if (this.activeLanguage !== "en") {
      const overlay = this.unitTitleOverlays[this.activeLanguage] || {};
      const translated = overlay[unit.unit_id] && String(overlay[unit.unit_id].title || "").trim();
      if (translated) return translated;
    }
    return unit.title || unit.unit_id;
  },

  getSubunitDisplayTitle(unit, subunit) {
    if (!subunit) return "";
    if (this.activeLanguage !== "en" && unit) {
      const overlay = this.subunitTitleOverlays[unit.unit_id + ":" + this.activeLanguage] || {};
      const translated = overlay[subunit.subunit_id] && String(overlay[subunit.subunit_id].title || "").trim();
      if (translated) return translated;
    }
    return subunit.title || subunit.subunit_id;
  },

  getDisplayNode(baseNode, unit, subunit) {
    const node = { ...baseNode };
    if (this.activeLanguage === "en") return node;

    const key = unit.unit_id + ":" + subunit.subunit_id + ":" + this.activeLanguage;
    const overlay = this.contentOverlays[key] || {};
    const translated = overlay[baseNode.node_id] || null;
    if (!translated) return node;

    TRANSLATABLE_FIELDS.forEach(field => {
      const value = String(translated[field] || "").trim();
      if (value) node[field] = value;
    });
    return node;
  },

  updateStaticUiLabels() {
    const focusBtn = document.getElementById("focusModeBtn");
    const exitFocusBtn = document.getElementById("exitFocusBtn");
    const componentToggleBtn = document.getElementById("componentToggleBtn");
    const languageSelect = document.getElementById("languageSelect");

    if (focusBtn) focusBtn.textContent = this.t("enterFocus");
    if (exitFocusBtn) exitFocusBtn.textContent = this.t("exitFocus");
    if (componentToggleBtn) componentToggleBtn.textContent = this.t("view");
    if (languageSelect && languageSelect.value !== this.activeLanguage) {
      languageSelect.value = this.activeLanguage;
    }
  },

  loadRegistry() {
    fetch(UNIT_REGISTRY_PATH, { cache: "no-store" })
      .then(response => {
        if (!response.ok) {
          throw new Error("Registry failed to load: " + response.status + " " + response.statusText);
        }
        return response.text();
      })
      .then(csvText => {
        const parsed = this.parseCsvText(csvText);

        if (parsed.errors && parsed.errors.length) {
          throw new Error(parsed.errors[0].message || "Registry CSV could not be parsed.");
        }

        this.registry = (parsed.data || []).filter(row => row && row.unit_id && row.folder);
        this.enabledUnits = this.registry.filter(row => {
          const enabled = String(row.enabled || "").trim();
          return enabled !== "0" && enabled.toLowerCase() !== "false" && enabled !== "";
        }).sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));

        if (!this.enabledUnits.length) {
          this.showError("No enabled units were found in the registry.");
          return;
        }

        const defaultUnit = this.enabledUnits[0];
        this.renderUnitMenu();
        this.selectUnit(defaultUnit.unit_id);
      })
      .catch(error => {
        this.showError("Unable to load registry: " + (error && error.message ? error.message : error));
      });
  },

  renderUnitMenu() {
    const menuHost = document.getElementById("unitMenu");
    if (!menuHost) return;
    menuHost.innerHTML = "";

    const subunitMenuHost = document.getElementById("subunitMenu");
    if (subunitMenuHost) subunitMenuHost.innerHTML = "";

    const title = document.createElement("div");
    title.className = "unit-menu-title";
    title.textContent = this.t("unit");
    menuHost.appendChild(title);

    const select = document.createElement("select");
    select.className = "unit-select";
    select.id = "unitSelect";
    select.setAttribute("aria-label", "Select Unit");

    this.enabledUnits.forEach(unit => {
      const option = document.createElement("option");
      option.value = unit.unit_id;
      option.textContent = this.getUnitDisplayTitle(unit);
      select.appendChild(option);
    });

    select.addEventListener("change", () => this.selectUnit(select.value));
    menuHost.appendChild(select);

    this.syncMenuHighlight();
  },

  clearLegacySceneState() {
    const sceneMain = document.getElementById("sceneMain");
    const editPanel = document.getElementById("editPanel");
    if (sceneMain) {
      sceneMain.innerHTML = "";
      sceneMain.classList.add("hidden");
    }
    if (editPanel) {
      editPanel.classList.add("hidden");
    }
  },

  selectUnit(unitId, { clearReturnStack = true } = {}) {
    const requestToken = ++this.loadToken;
    this.activeUnitId = unitId;
    this.activeSubunitId = null;
    this.activeNodeId = null;
    if (clearReturnStack) this.returnStack = [];
    this.syncMenuHighlight();
    this.clearLegacySceneState();

    const unit = this.enabledUnits.find(item => item.unit_id === unitId) || this.registry.find(item => item.unit_id === unitId);
    if (!unit) {
      this.showError("Selected unit is missing from the registry.");
      return;
    }

    this.loadUnitSubunits(unit)
      .then(subunits => this.loadSubunitTitleOverlay(unit).then(() => subunits))
      .then(subunits => {
        if (requestToken !== this.loadToken || this.activeUnitId !== unitId) {
          return;
        }

        if (!subunits.length) {
          this.showError("No enabled subunits were found for " + unit.title + ".");
          return;
        }

        this.unitRows[unitId] = subunits;
        this.renderSubunitMenu(subunits, unit);
        return this.indexUnit(unit).then(() => {
          if (requestToken === this.loadToken && this.activeUnitId === unitId) {
            return this.selectSubunit(subunits[0].subunit_id, unit, { clearReturnStack: false });
          }
        });
      })
      .catch(error => {
        if (requestToken !== this.loadToken || this.activeUnitId !== unitId) {
          return;
        }
        this.showError("Unable to load unit data for " + unit.title + ": " + (error && error.message ? error.message : error));
      });
  },

  renderSubunitMenu(subunits, unit) {
    this.clearLegacySceneState();
    const host = document.getElementById("unitLoaderPanel");
    const menuHost = document.getElementById("subunitMenu");
    if (!host || !menuHost) return;

    host.innerHTML = "<div class=\"unit-loader-card\"><div class=\"unit-loader-content\"></div></div>";
    menuHost.innerHTML = "";

    const title = document.createElement("div");
    title.className = "unit-menu-title";
    title.textContent = this.t("subunits");
    menuHost.appendChild(title);

    subunits.forEach(subunit => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "unit-menu-button subunit-menu-button";
      button.dataset.subunitId = subunit.subunit_id;
      button.textContent = this.getSubunitDisplayTitle(unit, subunit);
      button.addEventListener("click", () => this.selectSubunit(subunit.subunit_id, unit));
      menuHost.appendChild(button);
    });
  },

  loadUnitSubunits(unit) {
    if (this.unitRows[unit.unit_id]) return Promise.resolve(this.unitRows[unit.unit_id]);

    const csvPath = "units/" + unit.folder + "/unit.csv";
    return fetch(csvPath, { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Unit CSV failed to load: " + response.status + " " + response.statusText);
        return response.text();
      })
      .then(csvText => {
        const parsed = this.parseCsvText(csvText);
        if (parsed.errors && parsed.errors.length) throw new Error(parsed.errors[0].message || "Unit CSV could not be parsed.");

        const subunits = (parsed.data || []).filter(row => row && row.subunit_id && row.folder).filter(row => {
          const enabled = String(row.enabled || "").trim();
          return enabled !== "0" && enabled.toLowerCase() !== "false" && enabled !== "";
        }).sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
        this.unitRows[unit.unit_id] = subunits;
        return subunits;
      });
  },

  getSubunitCacheKey(unit, subunit) {
    return unit.unit_id + ":" + subunit.subunit_id;
  },

  loadSubunitRows(unit, subunit) {
    const cacheKey = this.getSubunitCacheKey(unit, subunit);
    if (this.subunitRows[cacheKey]) return Promise.resolve(this.subunitRows[cacheKey]);

    const csvPath = "units/" + unit.folder + "/" + subunit.folder + "/subunit.csv";
    return fetch(csvPath, { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Subunit CSV failed to load: " + response.status + " " + response.statusText);
        return response.text();
      })
      .then(csvText => {
        const parsed = this.parseCsvText(csvText);
        if (parsed.errors && parsed.errors.length) throw new Error(parsed.errors[0].message || "Subunit CSV could not be parsed.");

        const rows = (parsed.data || []).filter(row => row && (row.node_id || row.title || row.parent_id));
        this.subunitRows[cacheKey] = rows;
        rows.forEach(row => {
          if (!row.node_id) return;
          if (this.nodeIndex.has(row.node_id)) {
            console.warn("Duplicate global node_id ignored:", row.node_id);
            return;
          }
          this.nodeIndex.set(row.node_id, { unit, subunit, row, rows });
        });
        return rows;
      });
  },

  indexUnit(unit) {
    return this.loadUnitSubunits(unit)
      .then(subunits => Promise.all(subunits.map(subunit => this.loadSubunitRows(unit, subunit))));
  },

  resolveNode(nodeId) {
    const normalizedId = String(nodeId || "").trim();
    if (!normalizedId) return Promise.resolve(null);
    if (this.nodeIndex.has(normalizedId)) return Promise.resolve(this.nodeIndex.get(normalizedId));

    return Promise.all(this.enabledUnits.map(unit => this.indexUnit(unit)))
      .then(() => this.nodeIndex.get(normalizedId) || null);
  },

  selectSubunit(subunitId, unit, { targetNodeId = null, clearReturnStack = true } = {}) {
    const requestToken = ++this.loadToken;
    const subunit = (this.unitRows[unit.unit_id] || []).find(item => item.subunit_id === subunitId);
    if (!subunit) {
      this.showError("Selected subunit is missing from the unit registry.");
      return;
    }

    this.activeSubunitId = subunitId;
    this.activeNodeId = null;
    if (clearReturnStack) this.returnStack = [];
    this.syncSubunitHighlight();
    this.clearLegacySceneState();

    return this.loadSubunitRows(unit, subunit)
      .then(rows => {
        if (requestToken !== this.loadToken || this.activeUnitId !== unit.unit_id || this.activeSubunitId !== subunitId) {
          return;
        }

        const content = document.querySelector("#unitLoaderPanel .unit-loader-content");
        if (!content) return;
        content.innerHTML = "";

        const nodeId = targetNodeId || (rows.slice().sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))[0] || {}).node_id;
        if (nodeId) {
          this.selectNode(nodeId, rows, unit, subunit, false);
        } else {
          content.innerHTML = "<p class=\"unit-content-placeholder\">Content not yet developed.</p>";
        }
      })
      .catch(error => {
        if (requestToken !== this.loadToken || this.activeUnitId !== unit.unit_id || this.activeSubunitId !== subunitId) {
          return;
        }
        this.showError("Unable to load subunit data for " + subunit.title + ": " + (error && error.message ? error.message : error));
      });
  },

  hasValidTarget(nodeId) {
    const normalizedId = String(nodeId || "").trim();
    return !!normalizedId && this.nodeIndex.has(normalizedId);
  },

  navigateToNode(nodeId) {
    const normalizedId = String(nodeId || "").trim();
    return this.resolveNode(normalizedId)
      .then(target => {
        if (!target) {
          console.warn("CSV navigation target was not found:", normalizedId);
          return false;
        }

        const unitChanged = this.activeUnitId !== target.unit.unit_id;
        if (unitChanged) {
          this.activeUnitId = target.unit.unit_id;
          this.syncMenuHighlight();
          this.renderSubunitMenu(this.unitRows[target.unit.unit_id], target.unit);
        }

        return this.selectSubunit(target.subunit.subunit_id, target.unit, {
          targetNodeId: target.row.node_id,
          clearReturnStack: false
        }).then(() => true);
      })
      .catch(error => {
        console.warn("CSV navigation target could not be loaded:", normalizedId, error);
        return false;
      });
  },

  setNavigationButton(id, label, enabled, handler) {
    const button = document.getElementById(id);
    if (!button) return;
    button.textContent = label;
    button.disabled = !enabled;
    button.onclick = enabled ? handler : null;
  },

  updateBottomNavigationLegacy(node) {
    const previousNode = String(node.previous_node || "").trim();
    const nextNode = String(node.next_node || "").trim();
    const downNode = String(node.down_node || "").trim();
    const upNode = String(node.up_node || "").trim();
    const returnTarget = this.returnStack[this.returnStack.length - 1] || "";
    const canGoUp = this.hasValidTarget(returnTarget) || this.hasValidTarget(upNode);

    this.setNavigationButton("navPrev", "← Previous", this.hasValidTarget(previousNode), () => {
      this.navigateToNode(previousNode);
    });
    this.setNavigationButton("navNext", "Next →", this.hasValidTarget(nextNode), () => {
      this.navigateToNode(nextNode);
    });
    this.setNavigationButton("navDeep", "Go Deep ↓", this.hasValidTarget(downNode), () => {
      const originNodeId = this.activeNodeId;
      this.returnStack.push(originNodeId);
      this.navigateToNode(downNode).then(navigated => {
        if (!navigated) this.returnStack.pop();
      });
    });
    this.setNavigationButton("navUp", "↑ Up", canGoUp, () => {
      if (this.hasValidTarget(returnTarget)) {
        this.returnStack.pop();
        this.navigateToNode(returnTarget);
        return;
      }
      this.navigateToNode(upNode);
    });
  },

  updateBottomNavigation(node) {
    const previousNode = String(node.previous_node || "").trim();
    const nextNode = String(node.next_node || "").trim();
    const downNode = String(node.down_node || "").trim();
    const upNode = String(node.up_node || "").trim();
    const returnTarget = this.returnStack[this.returnStack.length - 1] || "";
    const canGoUp = this.hasValidTarget(returnTarget) || this.hasValidTarget(upNode);

    this.setNavigationButton("navPrev", "← " + this.t("previous"), this.hasValidTarget(previousNode), () => {
      this.navigateToNode(previousNode);
    });
    this.setNavigationButton("navNext", this.t("next") + " →", this.hasValidTarget(nextNode), () => {
      this.navigateToNode(nextNode);
    });
    this.setNavigationButton("navDeep", this.t("goDeep") + " ↓", this.hasValidTarget(downNode), () => {
      const originNodeId = this.activeNodeId;
      this.returnStack.push(originNodeId);
      this.navigateToNode(downNode).then(navigated => {
        if (!navigated) this.returnStack.pop();
      });
    });
    this.setNavigationButton("navUp", "↑ " + this.t("up"), canGoUp, () => {
      if (this.hasValidTarget(returnTarget)) {
        this.returnStack.pop();
        this.navigateToNode(returnTarget);
        return;
      }
      this.navigateToNode(upNode);
    });
  },

  normalizeImagePaths(value) {
    if (!value) return [];
    let raw = String(value).trim();
    if (!raw) return [];

    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {
        raw = raw.replace(/^\[|\]$/g, "");
      }
    }

    if (raw.includes("|")) return raw.split("|").map(item => item.trim()).filter(Boolean);
    if (raw.includes(",")) return raw.split(",").map(item => item.trim()).filter(Boolean);
    return [raw];
  },

  composeKeyIdea(node) {
    const lines = [];
    const memory = String(node.memory_badge || "").trim();
    const definition = String(node.definition || "").trim();
    const description = String(node.description || "").trim();
    const keyPoints = String(node.key_points || "").trim();

    if (definition) lines.push(definition);
    if (description) lines.push(description);

    const bulletItems = keyPoints ? keyPoints.split("|").map(item => item.trim()).filter(Boolean) : [];
    return { memory, intro: lines.join(" "), bulletItems };
  },

  renderKeyIdeaPanel(node, content) {
    const keyIdea = this.composeKeyIdea(node);
    const hasKeyIdea = !!(keyIdea.memory || keyIdea.intro || keyIdea.bulletItems.length);
    if (!hasKeyIdea) return;

    const panel = document.createElement("div");
    panel.className = "scene-key-idea";
    panel.dataset.componentKey = "keyIdea";

    const heading = document.createElement("h3");
    heading.textContent = this.t("keyIdea");
    panel.appendChild(heading);

    if (keyIdea.memory) {
      const badge = document.createElement("div");
      badge.className = "memory-badge";
      badge.textContent = keyIdea.memory;
      panel.appendChild(badge);
    }

    if (keyIdea.intro) {
      const intro = document.createElement("p");
      intro.className = "key-idea-intro teaching-card-body";
      intro.textContent = keyIdea.intro;
      panel.appendChild(intro);
    }

    if (keyIdea.bulletItems.length) {
      const list = document.createElement("ul");
      list.className = "key-idea-list";
      keyIdea.bulletItems.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      panel.appendChild(list);
    }

    content.appendChild(panel);
  },

  renderThinkPrompt(node, content) {
    const prompt = String(node.think_prompt || "").trim();
    if (!prompt) return;

    const panel = document.createElement("div");
    panel.className = "scene-think";
    panel.dataset.componentKey = "think";

    const heading = document.createElement("h3");
    heading.textContent = this.t("thinkAboutThis");
    panel.appendChild(heading);

    const text = document.createElement("p");
    text.className = "teaching-card-body";
    text.textContent = prompt;
    panel.appendChild(text);

    content.appendChild(panel);
  },

  renderCheckYourself(node, content) {
    const question = String(node.quick_check || "").trim();
    const answer = String(node.answer || "").trim();
    if (!question && !answer) return;

    const panel = document.createElement("div");
    panel.className = "scene-check";
    panel.dataset.componentKey = "check";

    const heading = document.createElement("h3");
    heading.textContent = this.t("checkYourself");
    panel.appendChild(heading);

    if (question) {
      const q = document.createElement("p");
      q.className = "check-question teaching-card-body";
      q.textContent = question;
      panel.appendChild(q);
    }

    if (answer) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "reveal-btn";
      button.textContent = this.t("revealAnswer");

      const answerBox = document.createElement("div");
      answerBox.className = "answer-box teaching-card-body hidden";
      answerBox.textContent = answer;
      button.addEventListener("click", () => {
        answerBox.classList.toggle("hidden");
        button.textContent = answerBox.classList.contains("hidden") ? this.t("revealAnswer") : this.t("hideAnswer");
      });

      panel.appendChild(button);
      panel.appendChild(answerBox);
    }

    content.appendChild(panel);
  },

  escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  resolveUnitImagePath(unit, subunit, imagePath) {
    const normalized = String(imagePath || "").trim();
    if (!normalized) return "";
    if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith("data:")) return normalized;
    if (normalized.startsWith("units/")) return normalized;
    return "units/" + unit.folder + "/" + subunit.folder + "/" + normalized.replace(/^\.\//, "");
  },

  renderMediaExceptionFallback(node, content) {
    const frame = document.createElement("div");
    frame.className = "scene-image-frame";
    frame.dataset.componentKey = "visual";

    const placeholder = document.createElement("div");
    placeholder.className = "image-placeholder";
    const description = this.getMediaDescription(node);
    placeholder.innerHTML = '<div class="ph-icon">◇</div><div class="ph-label">' + this.escapeHtml(this.t("mediaUnavailable")) + '</div>' + (description ? '<div class="ph-description">' + this.escapeHtml(description) + '</div>' : '');

    frame.appendChild(placeholder);
    content.appendChild(frame);
    return true;
  },

  renderImageArea(node, content, unit, subunit) {
    const raw = node.image_paths || node.imagePath || "";
    const images = this.normalizeImagePaths(raw);
    const description = this.getMediaDescription(node);

    if (!images.length) {
      if (description) {
        this.renderVisualNote(description, content);
        return true;
      }
      return false;
    }

    const frame = document.createElement("div");
    frame.className = "scene-image-frame";
    frame.dataset.componentKey = "visual";

    let rendered = false;
    let videoElement = null;
    let hasAttemptedMedia = false;

    images.forEach(imagePath => {
      const resolvedPath = this.resolveUnitImagePath(unit, subunit, imagePath);
      const mediaType = this.getMediaType(resolvedPath);
      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder hidden";
      placeholder.innerHTML = '<div class="ph-icon">◇</div><div class="ph-label">' + this.escapeHtml(this.t("mediaUnavailable")) + '</div>' + (description ? '<div class="ph-description">' + this.escapeHtml(description) + '</div>' : '') + '<div class="ph-expected">Expected: ' + this.escapeHtml(resolvedPath) + '</div>';

      let media;
      if (mediaType === "video") {
        media = document.createElement("video");
        media.className = "scene-media-video";
        media.autoplay = false;
        media.loop = false;
        media.muted = true;
        media.playsInline = true;
        media.preload = "metadata";
        media.controls = false;
      } else {
        media = document.createElement("img");
        media.className = "scene-visual-image";
        media.loading = "lazy";
      }

      media.alt = node.title || "Lesson media";

      const settle = (success) => {
        if (media.dataset.mediaSettled === "true") return;
        media.dataset.mediaSettled = "true";

        if (success) {
          media.classList.remove("hidden");
          placeholder.classList.add("hidden");
          rendered = true;
          if (mediaType === "video") {
            videoElement = media;
          }
          return;
        }

        media.remove();
        placeholder.classList.remove("hidden");
        rendered = true;
      };

      const handleCachedReadyState = () => {
        if (mediaType === "video") {
          if (media.readyState >= 2) {
            settle(true);
            return;
          }
          settle(false);
          return;
        }

        if (media.complete && media.naturalWidth > 0) {
          settle(true);
          return;
        }

        if (media.complete && media.naturalWidth === 0) {
          settle(false);
        }
      };

      if (!resolvedPath) return;
      hasAttemptedMedia = true;

      frame.appendChild(media);
      frame.appendChild(placeholder);
      placeholder.classList.add("hidden");

      if (mediaType === "video") {
        media.addEventListener("loadeddata", () => settle(true), { once: true });
        media.addEventListener("canplay", () => settle(true), { once: true });
        media.addEventListener("error", () => settle(false), { once: true });
        media.src = resolvedPath;
        media.load();
        handleCachedReadyState();
      } else {
        media.addEventListener("load", () => settle(true), { once: true });
        media.addEventListener("error", () => settle(false), { once: true });
        media.src = resolvedPath;
        handleCachedReadyState();
      }
    });

    if (!rendered && !hasAttemptedMedia) {
      if (description) {
        this.renderVisualNote(description, content);
      }
      return false;
    }

    if (!rendered && hasAttemptedMedia) {
      const firstPlaceholder = frame.querySelector(".image-placeholder");
      if (firstPlaceholder) firstPlaceholder.classList.remove("hidden");
    }

    content.appendChild(frame);

    if (videoElement) {
      const controls = this.buildVideoControls(videoElement);
      controls.dataset.componentKey = "visual";
      content.appendChild(controls);
    }

    return true;
  },

  getMediaType(path) {
    const normalizedPath = String(path || "").trim();
    if (!normalizedPath) return "image";
    const extension = normalizedPath.split(/[?#]/)[0].split(".").pop().toLowerCase();
    if (extension === "webm" || extension === "mp4") return "video";
    if (extension === "gif") return "gif";
    return "image";
  },

  getMediaDescription(node) {
    return String(node.image_description || node.media_description || "").trim();
  },

  renderVisualNote(description, content) {
    const note = document.createElement("section");
    note.className = "visual-note";
    note.dataset.componentKey = "visualNote";
    const heading = document.createElement("h3");
    heading.textContent = this.t("visualNote");
    const text = document.createElement("p");
    text.textContent = description;
    note.append(heading, text);
    content.appendChild(note);
  },

  buildVideoControls(video) {
    const controls = document.createElement("div");
    controls.className = "media-controls";
    const addButton = (label, action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "media-control-btn";
      button.textContent = label;
      button.addEventListener("click", action);
      controls.appendChild(button);
    };
    addButton("▶ Play", () => video.play().catch(() => {}));
    addButton("⏸ Pause", () => video.pause());
    addButton("↺ Replay", () => {
      try { video.currentTime = 0; } catch (error) { /* metadata not available yet */ }
      video.play().catch(() => {});
    });
    return controls;
  },

  setFocusMode(enabled) {
    const focusEnabled = Boolean(enabled);
    this.focusMode = focusEnabled;

    const topbar = document.querySelector(".topbar");
    const sidebar = document.getElementById("sidebar");
    const scrim = document.getElementById("scrim");
    const enterBtn = document.getElementById("focusModeBtn");
    const exitBtn = document.getElementById("exitFocusBtn");

    if (topbar) topbar.classList.toggle("hidden", focusEnabled);
    if (sidebar) {
      sidebar.classList.toggle("hidden", focusEnabled);
      sidebar.classList.remove("open");
    }
    if (scrim) {
      scrim.classList.remove("visible");
      scrim.classList.toggle("hidden", focusEnabled);
    }
    if (enterBtn) enterBtn.classList.toggle("hidden", focusEnabled);
    if (exitBtn) exitBtn.classList.toggle("hidden", !focusEnabled);

    document.body.classList.toggle("focus-mode", focusEnabled);
  },

  stopActiveMedia() {
    document.querySelectorAll("#unitLoaderPanel video").forEach(video => {
      video.pause();
      try { video.currentTime = 0; } catch (error) { /* metadata not available yet */ }
    });
  },

  getSceneComponentAvailability(node, unit, subunit) {
    const mediaPath = String(node.image_paths || node.imagePath || "").trim();
    const description = this.getMediaDescription(node);
    const title = String(node.title || unit.title || unit.unit_id || "").trim();
    const hasKeyIdea = !!(node.memory_badge || node.definition || node.description || node.key_points);
    const hasThink = !!String(node.think_prompt || "").trim();
    const hasCheck = !!(String(node.quick_check || "").trim() || String(node.answer || "").trim());

    return {
      title: !!title,
      visual: !!mediaPath,
      visualNote: !!description && !mediaPath,
      keyIdea: hasKeyIdea,
      think: hasThink,
      check: hasCheck
    };
  },

  applySceneComponentVisibility() {
    const state = this.componentState || {};
    document.querySelectorAll("[data-component-key]").forEach(element => {
      const key = element.dataset.componentKey;
      const visible = key ? state[key] !== false : true;
      element.style.display = visible ? "" : "none";
    });

    if (state.visual === false) {
      this.stopActiveMedia();
    }
  },

  resetSceneComponentState(node, unit, subunit) {
    const availability = this.getSceneComponentAvailability(node, unit, subunit);
    this.componentState = Object.fromEntries(Object.entries(availability).map(([key, value]) => [key, value]));
    this.applySceneComponentVisibility();
    this.renderSceneComponentControls();
  },

  renderSceneComponentControls() {
    const driver = document.getElementById("componentMenu");
    const toggle = document.getElementById("componentToggleBtn");
    if (!driver || !toggle) return;

    driver.innerHTML = "";
    const tokens = [
      { key: "title", label: "Title" },
      { key: "visual", label: "Visual" },
      { key: "visualNote", label: this.t("visualNote") },
      { key: "keyIdea", label: this.t("keyIdea") },
      { key: "think", label: this.t("thinkAboutThis") },
      { key: "check", label: this.t("checkYourself") }
    ];

    const currentSceneEntries = tokens.filter(item => {
      if (item.key === "visualNote") return this.componentState.visualNote === true;
      if (item.key === "visual") return this.componentState.visual === true;
      return this.componentState[item.key] !== undefined;
    });

    if (!currentSceneEntries.length) {
      toggle.classList.add("hidden");
      driver.classList.add("hidden");
      return;
    }

    toggle.classList.remove("hidden");
    driver.classList.add("hidden");
    currentSceneEntries.forEach(item => {
      const wrapper = document.createElement("label");
      wrapper.className = "component-menu-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this.componentState[item.key] !== false;
      checkbox.addEventListener("change", () => {
        this.componentState[item.key] = checkbox.checked;
        this.applySceneComponentVisibility();
      });

      const text = document.createElement("span");
      text.textContent = item.label;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(text);
      driver.appendChild(wrapper);
    });
  },

  selectNode(nodeId, rows, unit, subunit, focus = true) {
    this.clearLegacySceneState();
    this.stopActiveMedia();
    this.activeNodeId = nodeId;
    const host = document.getElementById("unitLoaderPanel");
    if (!host) return;

    const sortedNodes = (rows || []).slice().sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
    const content = host.querySelector(".unit-loader-content");
    if (!content) return;

    const node = sortedNodes.find(item => item.node_id === nodeId);
    if (!node) {
      content.innerHTML = "<p class=\"unit-content-placeholder\">Content not yet developed.</p>";
      this.resetSceneComponentState({ image_paths: "" }, unit, subunit);
      return;
    }

    const hasAnyContent = Boolean(
      node.title ||
      node.memory_badge ||
      node.think_prompt ||
      node.definition ||
      node.description ||
      node.key_points ||
      node.quick_check ||
      node.answer ||
      node.image_paths
    );

    if (!hasAnyContent) {
      content.innerHTML = "<p class=\"unit-content-placeholder\">Content not yet developed.</p>";
      this.resetSceneComponentState({ image_paths: "" }, unit, subunit);
      return;
    }

    this.loadContentOverlay(unit, subunit).then(() => {
      if (this.activeUnitId !== unit.unit_id || this.activeSubunitId !== subunit.subunit_id || this.activeNodeId !== nodeId) {
        return;
      }
      this.renderSelectedNode(this.getDisplayNode(node, unit, subunit), content, unit, subunit, focus);
    });
  },

  renderSelectedNode(node, content, unit, subunit, focus = true) {
    content.innerHTML = "";

    const title = document.createElement("h1");
    title.className = "scene-title";
    title.dataset.componentKey = "title";
    title.textContent = node.title || this.getUnitDisplayTitle(unit) || unit.unit_id;
    content.appendChild(title);

    const teachingLayout = document.createElement("div");
    teachingLayout.className = "scene-teaching-layout";

    const sidePanel = document.createElement("div");
    sidePanel.className = "scene-side-panel";
    this.renderKeyIdeaPanel(node, sidePanel);
    this.renderThinkPrompt(node, sidePanel);
    this.renderCheckYourself(node, sidePanel);

    const visualPanel = document.createElement("div");
    visualPanel.className = "scene-visual-panel";
    let hasVisualContent = false;
    try {
      hasVisualContent = this.renderImageArea(node, visualPanel, unit, subunit);
    } catch (error) {
      console.error("Media render failed for scene", node.node_id, error);
      hasVisualContent = this.renderMediaExceptionFallback(node, visualPanel);
    }
    if (hasVisualContent || visualPanel.childElementCount > 0) {
      teachingLayout.appendChild(visualPanel);
    }
    teachingLayout.appendChild(sidePanel);
    content.appendChild(teachingLayout);
    this.updateBottomNavigation(node);
    this.resetSceneComponentState(node, unit, subunit);

    if (focus && typeof window !== "undefined") {
      content.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  },

  setLanguage(language) {
    if (!UI_LABELS[language] || language === this.activeLanguage) return;

    const currentUnitId = this.activeUnitId;
    const currentSubunitId = this.activeSubunitId;
    const currentNodeId = this.activeNodeId;
    const unit = this.enabledUnits.find(item => item.unit_id === currentUnitId) || this.registry.find(item => item.unit_id === currentUnitId);
    const subunit = unit ? (this.unitRows[unit.unit_id] || []).find(item => item.subunit_id === currentSubunitId) : null;
    const rows = unit && subunit ? this.subunitRows[this.getSubunitCacheKey(unit, subunit)] : null;

    this.activeLanguage = language;
    this.updateStaticUiLabels();

    Promise.all([
      this.loadUnitTitleOverlay(language),
      unit ? this.loadSubunitTitleOverlay(unit, language) : Promise.resolve({}),
      unit && subunit ? this.loadContentOverlay(unit, subunit, language) : Promise.resolve({})
    ]).then(() => {
      this.renderUnitMenu();
      if (unit && this.unitRows[unit.unit_id]) {
        this.renderSubunitMenu(this.unitRows[unit.unit_id], unit);
        this.syncSubunitHighlight();
      }
      if (unit && subunit && rows && currentNodeId) {
        this.activeUnitId = currentUnitId;
        this.activeSubunitId = currentSubunitId;
        this.activeNodeId = currentNodeId;
        this.syncMenuHighlight();
        this.syncSubunitHighlight();
        this.selectNode(currentNodeId, rows, unit, subunit, false);
      }
      this.updateStaticUiLabels();
    });
  },

  syncMenuHighlight() {
    const select = document.getElementById("unitSelect");
    if (select && select.value !== this.activeUnitId) {
      select.value = this.activeUnitId || "";
    }
  },

  syncSubunitHighlight() {
    const buttons = document.querySelectorAll("#subunitMenu .subunit-menu-button");
    buttons.forEach(button => {
      const isActive = button.dataset.subunitId === this.activeSubunitId;
      button.classList.toggle("active", isActive);
    });
  },

  showError(message) {
    this.clearLegacySceneState();
    const host = document.getElementById("unitLoaderPanel");
    if (!host) return;
    host.innerHTML = "";
    const box = document.createElement("div");
    box.className = "unit-loader-error";
    box.textContent = message;
    host.appendChild(box);
  }
};

function bindShellControls() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  const focusBtn = document.getElementById("focusModeBtn");
  const exitFocusBtn = document.getElementById("exitFocusBtn");
  const componentToggleBtn = document.getElementById("componentToggleBtn");
  const componentMenu = document.getElementById("componentMenu");
  const languageSelect = document.getElementById("languageSelect");

  if (sidebarToggle && sidebar && scrim) {
    sidebarToggle.addEventListener("click", () => {
      if (document.body.classList.contains("focus-mode")) return;
      sidebar.classList.toggle("open");
      scrim.classList.toggle("visible");
    });
    scrim.addEventListener("click", () => {
      sidebar.classList.remove("open");
      scrim.classList.remove("visible");
    });
  }

  if (focusBtn) {
    focusBtn.addEventListener("click", () => UnitLoader.setFocusMode(true));
  }

  if (exitFocusBtn) {
    exitFocusBtn.addEventListener("click", () => UnitLoader.setFocusMode(false));
  }

  if (componentToggleBtn && componentMenu) {
    componentToggleBtn.addEventListener("click", () => {
      const isHidden = componentMenu.classList.toggle("hidden");
      componentToggleBtn.setAttribute("aria-expanded", String(!isHidden));
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener("change", () => UnitLoader.setLanguage(languageSelect.value));
  }

  ["navPrev", "navUp", "navDeep", "navNext"].forEach(id => {
    const button = document.getElementById(id);
    if (button) {
      button.disabled = true;
      button.onclick = null;
    }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  bindShellControls();
  window.UnitLoader = UnitLoader;
  UnitLoader.init();
});
