const columnNames = ["Cột 1 · Siêu dễ", "Cột 2 · Dễ", "Cột 3 · Trung bình", "Cột 4 · Trung bình khá", "Cột 5 · Khá", "Cột 6 · Khó"];
const levelLabels = [
  { name: "SIÊU DỄ", x: 131, y: 236 },
  { name: "DỄ", x: 330, y: 220 },
  { name: "TRUNG BÌNH", x: 526, y: 215 },
  { name: "TRUNG BÌNH KHÁ", x: 721, y: 203 },
  { name: "KHÁ", x: 924, y: 187 },
  { name: "KHÓ", x: 1155, y: 162 }
];
const routes = [
  [
    ["Rừng Phước Bửu", "box"], ["Nam Cát Tiên", "box"], ["Chư Blúk - Hồ Đá", "box"]
  ],
  [
    ["Tượng Kỳ", "box"], ["Minh Đạm", "box"], ["Thị Vải", "box"], ["Tóc Tiên", "box"], ["Núi Dinh", "box"]
  ],
  [
    ["Núi Lubu", "box"], ["Thác Phi Liêng", "box"], ["Thác Mưa Bay", "box"], ["Núi Tà Cú", "box"], ["Laan - Tuyệt Tình Cốc", "box"]
  ],
  [
    ["Hồ Tiên - La Ngâu", "box"], ["Masara - Đồi Cô Hồng", "box"], ["Lombur - Con đường lương thực", "box"],
    ["Thác K50", "box"], ["Thác Siêu Đuông", "box"], ["Thác Triệu Hải", "box"], ["Chư Nâm - Chư Đăng Ya", "box"],
    ["Cực Đông - Mũi Đôi", "box"], ["Núi Cấm", "box"], ["VQG Bù Gia Mập", "box"], ["Núi Langbiang - Đồi Radar", "box"],
    ["Núi Đại Bình", "box"], ["Núi Chứa Chan", "box"]
  ],
  [
    ["Tà Năng - Đồi Lính - Phan Dũng", "box"], ["Đỉnh Tà Đùng", "box"], ["3 Đỉnh Lomburr - Thác Lâm An", "box"],
    ["Chư Yang Lak", "box"], ["VQG Núi Chúa", "box"], ["Núi Bà Đen (Chùa - Cột)", "box"], ["Núi Brahyang - Yang Doan", "box"],
    ["Mộng Đào Nguyên", "box"], ["Hoàng Ngư Sơn", "box"], ["Thảo Nguyên Pai Sol", "box"], ["Bidoup Đỉnh", "box"],
    ["Thác Tam Thâm", "box"]
  ],
  [
    ["Chư H'Mu - Hòn Vọng Phu", "box"], ["Phan Dũng - Yavly - Tà Năng", "box"],
    ["Bidoup - Phước Bình - Tà Giang", "box"], ["Chư Yang Sin", "box"]
  ]
];

const iconLabels = { box: "□ Checkbox", check: "✓ Check", x: "✕ X mark" };
const legacyStorageKey = "trekking-infographic-settings-v1";
const BASE_WIDTH = 1280;
const OUTPUT_WIDTH = 2160;
const OUTPUT_SCALE = OUTPUT_WIDTH / BASE_WIDTH;
const TOP_HEIGHT = 418;
const CRITERIA_LABEL_BASE_WIDTH = 320;
const APPEARANCE_CONTROLS = [
  { key: "subtitleFontSize", inputId: "subtitle-font-size", outputId: "subtitle-font-size-value", defaultValue: 32, min: 16, max: 48, unit: "px" },
  { key: "titleFontSize", inputId: "title-font-size", outputId: "title-font-size-value", defaultValue: 81, min: 24, max: 100, unit: "px" },
  { key: "routeFontSize", inputId: "route-font-size", outputId: "route-font-size-value", defaultValue: 18, min: 9, max: 24, unit: "px" },
  { key: "levelLabelFontSize", inputId: "level-label-font-size", outputId: "level-label-font-size-value", defaultValue: 21, min: 10, max: 30, unit: "px" },
  { key: "criteriaLabelVertical", inputId: "criteria-label-vertical", outputId: "criteria-label-vertical-value", defaultValue: 12, min: 0, max: 200, unit: "px" },
  { key: "criteriaLabelHorizontal", inputId: "criteria-label-horizontal", outputId: "criteria-label-horizontal-value", defaultValue: 38, min: 0, max: 400, unit: "px" },
  { key: "criteriaLabelScale", inputId: "criteria-label-scale", outputId: "criteria-label-scale-value", defaultValue: 91, min: 50, max: 200, unit: "%" }
];
const poster = document.getElementById("poster");
const posterWrap = document.querySelector(".canvas-wrap");
const posterBottom = document.getElementById("poster-bottom");
const posterColumns = document.getElementById("poster-columns");
const posterLevelLabels = document.getElementById("poster-level-labels");
const peakImage = document.getElementById("peak-image");
const criteriaLabel = document.getElementById("criteria-label");
const status = document.getElementById("status");
let backgroundObjectUrl = null;
let persistenceAvailable = false;
let saveTimer = null;
let saveQueue = Promise.resolve();
let criteriaLabelTransparencyPromise = null;

function setStatus(message) {
  status.textContent = message;
}

function ensureCriteriaLabelTransparency() {
  if (!criteriaLabelTransparencyPromise) {
    criteriaLabelTransparencyPromise = (async () => {
      await criteriaLabel.decode();
      const width = criteriaLabel.naturalWidth;
      const height = criteriaLabel.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Trình duyệt không tạo được bộ xử lý nhãn tiêu chí.");
      context.drawImage(criteriaLabel, 0, 0);

      const imageData = context.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      const pixelCount = width * height;
      const visited = new Uint8Array(pixelCount);
      const queue = new Int32Array(pixelCount);
      let queueHead = 0;
      let queueTail = 0;
      const enqueueBackgroundPixel = (index) => {
        if (visited[index]) return;
        visited[index] = 1;
        const offset = index * 4;
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const minimum = Math.min(red, green, blue);
        const maximum = Math.max(red, green, blue);
        if (minimum >= 220 && maximum - minimum <= 42) {
          queue[queueTail++] = index;
        }
      };

      for (let x = 0; x < width; x += 1) {
        enqueueBackgroundPixel(x);
        enqueueBackgroundPixel((height - 1) * width + x);
      }
      for (let y = 0; y < height; y += 1) {
        enqueueBackgroundPixel(y * width);
        enqueueBackgroundPixel(y * width + width - 1);
      }

      while (queueHead < queueTail) {
        const index = queue[queueHead++];
        pixels[index * 4 + 3] = 0;
        const x = index % width;
        const y = Math.floor(index / width);
        if (x > 0) enqueueBackgroundPixel(index - 1);
        if (x + 1 < width) enqueueBackgroundPixel(index + 1);
        if (y > 0) enqueueBackgroundPixel(index - width);
        if (y + 1 < height) enqueueBackgroundPixel(index + width);
      }

      context.putImageData(imageData, 0, 0);
      criteriaLabel.src = canvas.toDataURL("image/png");
      await criteriaLabel.decode();
    })();
  }
  return criteriaLabelTransparencyPromise;
}

function currentSettings() {
  return {
    title: document.getElementById("title").value,
    footer: document.getElementById("footer").value,
    routes: routes.map((group) => group.map((route) => [...route])),
    appearance: currentAppearance()
  };
}

function validateAppearance(appearance) {
  if (appearance === undefined) return Object.fromEntries(
    APPEARANCE_CONTROLS.map(({ key, defaultValue }) => [key, defaultValue])
  );
  if (!appearance || typeof appearance !== "object" || Array.isArray(appearance)) {
    throw new Error("Cấu hình giao diện không hợp lệ.");
  }

  const allowedKeys = new Set(APPEARANCE_CONTROLS.map(({ key }) => key));
  if (Object.keys(appearance).some((key) => !allowedKeys.has(key))) {
    throw new Error("Cấu hình giao diện chứa thuộc tính không được hỗ trợ.");
  }

  const validated = {};
  APPEARANCE_CONTROLS.forEach(({ key, defaultValue, min, max }) => {
    const value = Object.prototype.hasOwnProperty.call(appearance, key)
      ? appearance[key]
      : defaultValue;
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`Giá trị ${key} phải là số nguyên từ ${min} đến ${max}.`);
    }
    validated[key] = value;
  });
  return validated;
}

function currentAppearance() {
  const appearance = {};
  APPEARANCE_CONTROLS.forEach(({ key, inputId }) => {
    appearance[key] = Number(document.getElementById(inputId).value);
  });
  return validateAppearance(appearance);
}

function applyAppearance(appearance) {
  APPEARANCE_CONTROLS.forEach(({ key, inputId, outputId, unit }) => {
    const value = appearance[key];
    document.getElementById(inputId).value = String(value);
    document.getElementById(outputId).value = `${value} ${unit}`;
  });
  poster.style.setProperty("--poster-subtitle-font-size", `${appearance.subtitleFontSize}px`);
  poster.style.setProperty("--poster-title-font-size", `${appearance.titleFontSize}px`);
  poster.style.setProperty("--poster-route-font-size", `${appearance.routeFontSize}px`);
  poster.style.setProperty("--poster-level-font-size", `${appearance.levelLabelFontSize}px`);
  criteriaLabel.style.bottom = `${appearance.criteriaLabelVertical}px`;
  criteriaLabel.style.left = `${appearance.criteriaLabelHorizontal}px`;
  criteriaLabel.style.width = `${CRITERIA_LABEL_BASE_WIDTH * appearance.criteriaLabelScale / 100}px`;
}

function validateSettings(settings) {
  if (!settings || typeof settings !== "object" ||
      typeof settings.title !== "string" || typeof settings.footer !== "string" ||
      !Array.isArray(settings.routes) || settings.routes.length !== routes.length) {
    throw new Error("Cấu trúc cài đặt không hợp lệ.");
  }

  const validatedRoutes = settings.routes.map((group) => {
    if (!Array.isArray(group)) throw new Error("Danh sách cung đường không hợp lệ.");
    return group.map((route) => {
      if (!Array.isArray(route) || typeof route[0] !== "string" ||
          !Object.prototype.hasOwnProperty.call(iconLabels, route[1])) {
        throw new Error("Một cung đường hoặc biểu tượng không hợp lệ.");
      }
      return [route[0], route[1]];
    });
  });
  return {
    title: settings.title,
    footer: settings.footer,
    routes: validatedRoutes,
    appearance: validateAppearance(settings.appearance)
  };
}

function applySettings(settings) {
  document.getElementById("title").value = settings.title;
  document.getElementById("footer").value = settings.footer;
  applyAppearance(settings.appearance);
  settings.routes.forEach((group, groupIndex) => {
    routes[groupIndex].splice(0, routes[groupIndex].length, ...group);
  });
}

async function writeSettingsToServer(settings) {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings)
  });
  if (!response.ok) {
    throw new Error(`Lưu config/settings.json thất bại (HTTP ${response.status}): ${await response.text()}`);
  }
}

function saveSettings() {
  if (!persistenceAvailable) return;
  if (saveTimer) clearTimeout(saveTimer);
  const settings = currentSettings();
  document.getElementById("save-state").textContent = "Đang lưu config/settings.json...";
  saveTimer = setTimeout(() => {
    saveQueue = saveQueue
      .then(() => writeSettingsToServer(settings))
      .then(() => {
        document.getElementById("save-state").textContent = "Đã lưu vào config/settings.json.";
      })
      .catch((error) => {
        persistenceAvailable = false;
        document.getElementById("save-state").textContent = `Không thể lưu cài đặt: ${error.message}`;
      });
  }, 250);
}

async function loadSettings() {
  let legacySettings = null;
  let migrationWarning = "";
  try {
    let legacyStored = null;
    try {
      legacyStored = localStorage.getItem(legacyStorageKey);
    } catch (error) {
      migrationWarning = `Không thể đọc cài đặt cũ từ trình duyệt: ${error.message}`;
    }

    const response = await fetch("/api/settings", { cache: "no-store" });
    let fileSettings = null;
    if (response.ok) {
      fileSettings = validateSettings(await response.json());
    } else if (response.status !== 404) {
      throw new Error(`Không thể đọc config/settings.json (HTTP ${response.status}): ${await response.text()}`);
    }

    if (legacyStored) {
      try {
        legacySettings = validateSettings(JSON.parse(legacyStored));
      } catch (error) {
        migrationWarning = `Không thể chuyển cài đặt cũ sang JSON: ${error.message}`;
      }
    }

    if (legacySettings) {
      await writeSettingsToServer(legacySettings);
      fileSettings = legacySettings;
      try {
        localStorage.removeItem(legacyStorageKey);
      } catch (error) {
        migrationWarning = `Đã lưu cài đặt vào repo nhưng không xóa được bản cũ: ${error.message}`;
      }
    } else if (!fileSettings) {
      fileSettings = validateSettings(currentSettings());
      await writeSettingsToServer(fileSettings);
    }

    applySettings(fileSettings);
    persistenceAvailable = true;
    document.getElementById("save-state").textContent =
      migrationWarning || (legacySettings
        ? "Đã chuyển cài đặt cũ sang config/settings.json."
        : "Đã tải cài đặt từ config/settings.json.");
  } catch (error) {
    persistenceAvailable = false;
    try {
      const legacyStored = localStorage.getItem(legacyStorageKey);
      if (legacyStored) {
        applySettings(validateSettings(JSON.parse(legacyStored)));
        document.getElementById("save-state").textContent =
          `Không thể đọc/ghi config/settings.json: ${error.message}. Đã khôi phục cài đặt cũ; hãy xuất JSON, chạy server.py, rồi nhập file JSON để chuyển vào repo.`;
      } else {
        document.getElementById("save-state").textContent =
          `Không thể đọc/ghi config/settings.json: ${error.message}. Hãy chạy python server.py và mở http://127.0.0.1:8765.`;
      }
    } catch (legacyError) {
      document.getElementById("save-state").textContent =
        `Không thể khôi phục cài đặt: ${legacyError.message}. Hãy chạy python server.py và mở http://127.0.0.1:8765.`;
    }
  }
  renderEditor();
  render();
}

function routeRowHtml(route, groupIndex, routeIndex) {
  const options = Object.keys(iconLabels).map((icon) =>
    `<option value="${icon}"${route[1] === icon ? " selected" : ""}>${iconLabels[icon]}</option>`
  ).join("");

  return `<div class="route-row" data-group="${groupIndex}" data-route="${routeIndex}">
    <input type="text" aria-label="Tên cung đường" value="${escapeAttribute(route[0])}">
    <select aria-label="Biểu tượng cung đường">${options}</select>
    <button class="remove" type="button" aria-label="Xóa cung đường">×</button>
  </div>`;
}

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function renderEditor() {
  document.getElementById("groups").innerHTML = routes.map((group, groupIndex) =>
    `<section class="route-group">
      <div class="group-title">${columnNames[groupIndex]}</div>
      ${group.map((route, routeIndex) => routeRowHtml(route, groupIndex, routeIndex)).join("")}
      <button class="add-route" type="button" data-add="${groupIndex}">+ Thêm cung đường</button>
    </section>`
  ).join("");
}

function fitHeading(element, text, startingSize, minimumSize, maxWidth) {
  element.textContent = text;
  let size = startingSize;
  element.style.fontSize = `${size}px`;
  while (element.scrollWidth > maxWidth && size > minimumSize) {
    size = Math.max(minimumSize, size - 1);
    element.style.fontSize = `${size}px`;
  }
}

function render() {
  const appearance = currentAppearance();
  applyAppearance(appearance);
  fitHeading(
    document.getElementById("poster-subtitle"),
    "XẾP HẠNG CÁC CUNG ĐƯỜNG TREKKING",
    appearance.subtitleFontSize,
    APPEARANCE_CONTROLS[0].min,
    680
  );
  fitHeading(
    document.getElementById("poster-title"),
    document.getElementById("title").value.toLocaleUpperCase("vi-VN"),
    appearance.titleFontSize,
    APPEARANCE_CONTROLS[1].min,
    600
  );
  document.getElementById("poster-footer").textContent = document.getElementById("footer").value;
  posterLevelLabels.replaceChildren();
  levelLabels.forEach(({ name, x, y }) => {
    const label = document.createElement("div");
    label.className = "poster-level-label";
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    const heading = document.createElement("span");
    heading.textContent = "CẤP ĐỘ";
    const level = document.createElement("span");
    level.textContent = name;
    label.append(heading, level);
    posterLevelLabels.append(label);
  });
  posterColumns.replaceChildren();

  routes.forEach((group) => {
    const column = document.createElement("div");
    column.className = "poster-column";
    const routeList = document.createElement("div");
    routeList.className = "poster-route-list";
    group.forEach(([name, iconType]) => {
      const route = document.createElement("div");
      route.className = "poster-route";
      const icon = document.createElement("span");
      icon.className = `poster-route-icon ${iconType}`;
      icon.setAttribute("aria-hidden", "true");
      if (iconType === "check") icon.textContent = "✓";
      if (iconType === "x") icon.textContent = "×";
      const routeName = document.createElement("span");
      routeName.className = "poster-route-name";
      routeName.textContent = name;
      route.append(icon, routeName);
      routeList.append(route);
    });
    column.append(routeList);
    posterColumns.append(column);
  });

  const columnHeights = Array.from(
    posterColumns.children,
    (column) => column.querySelector(".poster-route-list").scrollHeight
  );
  const tallestRouteColumn = Math.max(0, ...columnHeights);
  const firstColumnHeight = Math.max(columnHeights[0] || 0, columnHeights[1] || 0);
  const bottomHeight = Math.max(
    302,
    posterColumns.scrollHeight + 39,
    firstColumnHeight + 244
  );
  posterBottom.style.height = `${bottomHeight}px`;
  const outputHeight = Math.ceil((TOP_HEIGHT + bottomHeight) * OUTPUT_SCALE);
  document.getElementById("dimensions").textContent = `${OUTPUT_WIDTH} × ${outputHeight} px`;
  updatePreviewScale();
}

function updatePreviewScale() {
  const scale = Math.min(1, posterWrap.clientWidth / BASE_WIDTH);
  poster.style.zoom = String(scale);
  posterWrap.scrollLeft = 0;
}

function canvasFont(style) {
  return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

function wrapCanvasText(context, text, maxWidth) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  const pushCharacterWrappedWord = (word) => {
    for (const character of word) {
      const candidate = line + character;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = candidate;
      }
    }
  };

  words.forEach((word) => {
    if (context.measureText(word).width > maxWidth) {
      if (line) {
        lines.push(line);
        line = "";
      }
      pushCharacterWrappedWord(word);
    } else {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
  });
  if (line) lines.push(line);
  return lines;
}

function relativeRect(element, rootRect) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - rootRect.left,
    y: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height
  };
}

async function renderPosterPng() {
  await Promise.all([peakImage.decode(), ensureCriteriaLabelTransparency()]);
  const previousZoom = poster.style.zoom;
  poster.style.zoom = "1";
  try {
    const baseHeight = poster.offsetHeight;
    const outputHeight = Math.ceil(baseHeight * OUTPUT_SCALE);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = OUTPUT_WIDTH;
    exportCanvas.height = outputHeight;
    const context = exportCanvas.getContext("2d");
    if (!context) throw new Error("Trình duyệt không tạo được bộ dựng ảnh.");
    context.scale(OUTPUT_SCALE, OUTPUT_SCALE);
    const posterRect = poster.getBoundingClientRect();

    const sourceHeight = peakImage.naturalWidth * TOP_HEIGHT / BASE_WIDTH;
    const sourceY = Math.max(0, (peakImage.naturalHeight - sourceHeight) / 2);
    context.drawImage(
      peakImage,
      0, sourceY, peakImage.naturalWidth, sourceHeight,
      0, 0, BASE_WIDTH, TOP_HEIGHT
    );

    const subtitle = document.getElementById("poster-subtitle");
    const title = document.getElementById("poster-title");
    for (const element of [subtitle, title]) {
      const style = getComputedStyle(element);
      const rect = relativeRect(element, posterRect);
      context.font = canvasFont(style);
      context.fillStyle = style.color;
      context.textBaseline = "top";
      context.shadowColor = "rgba(255,255,255,.72)";
      context.shadowBlur = 3;
      context.fillText(element.textContent, rect.x, rect.y);
    }
    context.shadowBlur = 0;

    const firstLevelLabel = posterLevelLabels.querySelector(".poster-level-label");
    const levelStyle = getComputedStyle(firstLevelLabel);
    const levelLineHeight = parseFloat(levelStyle.lineHeight) || 18;
    context.font = canvasFont(levelStyle);
    context.fillStyle = levelStyle.color;
    context.textAlign = "center";
    context.textBaseline = "top";
    context.shadowColor = "rgba(255,255,255,.9)";
    context.shadowBlur = 2;
    levelLabels.forEach(({ name, x, y }) => {
      context.fillText("CẤP ĐỘ", x, y);
      context.fillText(name, x, y + levelLineHeight);
    });
    context.shadowBlur = 0;
    context.textAlign = "left";

    const bottomRect = relativeRect(posterBottom, posterRect);
    const panel = context.createLinearGradient(0, bottomRect.y, 0, baseHeight);
    panel.addColorStop(0, "#075f96");
    panel.addColorStop(1, "#0878ad");
    context.fillStyle = panel;
    context.fillRect(0, bottomRect.y, BASE_WIDTH, baseHeight - bottomRect.y);

    const columns = Array.from(posterColumns.children);
    context.save();
    context.strokeStyle = "rgba(255,255,255,.8)";
    context.lineWidth = 1.5;
    context.setLineDash([2, 3]);
    columns.slice(0, -1).forEach((column) => {
      const rect = relativeRect(column, posterRect);
      context.beginPath();
      context.moveTo(rect.x + rect.width - 0.75, rect.y);
      context.lineTo(rect.x + rect.width - 0.75, rect.y + rect.height);
      context.stroke();
    });
    context.restore();

    columns.forEach((column) => {
      column.querySelectorAll(".poster-route").forEach((route) => {
        const icon = route.querySelector(".poster-route-icon");
        const name = route.querySelector(".poster-route-name");
        const iconRect = relativeRect(icon, posterRect);
        const nameRect = relativeRect(name, posterRect);
        const iconStyle = getComputedStyle(icon);
        context.fillStyle = iconStyle.color;
        context.strokeStyle = iconStyle.color;
        if (icon.classList.contains("box")) {
          context.lineWidth = 1.5;
          context.strokeRect(iconRect.x, iconRect.y + 2, 11, 11);
        } else {
          context.font = canvasFont(iconStyle);
          context.textBaseline = "top";
          context.fillText(icon.textContent, iconRect.x, iconRect.y);
        }

        const nameStyle = getComputedStyle(name);
        context.font = canvasFont(nameStyle);
        context.fillStyle = nameStyle.color;
        context.textBaseline = "top";
        const lineHeight = parseFloat(nameStyle.lineHeight) || 18;
        wrapCanvasText(context, name.textContent, nameRect.width).forEach((line, index) => {
          context.fillText(line, nameRect.x, nameRect.y + index * lineHeight);
        });
      });
    });

    const labelRect = relativeRect(criteriaLabel, posterRect);
    context.drawImage(criteriaLabel, labelRect.x, labelRect.y, labelRect.width, labelRect.height);

    const footer = document.getElementById("poster-footer");
    if (footer.textContent.trim()) {
      const rect = relativeRect(footer, posterRect);
      const style = getComputedStyle(footer);
      context.font = canvasFont(style);
      context.fillStyle = style.color;
      context.textBaseline = "top";
      context.textAlign = "right";
      context.shadowColor = "#063e68";
      context.shadowBlur = 2;
      const lineHeight = parseFloat(style.lineHeight) || 26;
      wrapCanvasText(context, footer.textContent, rect.width).forEach((line, index) => {
        context.fillText(line, rect.x + rect.width, rect.y + index * lineHeight);
      });
      context.shadowBlur = 0;
      context.textAlign = "left";
    }

    return await new Promise((resolve, reject) => {
      exportCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Không thể mã hóa poster thành PNG."));
      }, "image/png");
    });
  } finally {
    poster.style.zoom = previousZoom;
  }
}

document.getElementById("title").addEventListener("input", () => {
  render();
  saveSettings();
});
document.getElementById("footer").addEventListener("input", () => {
  render();
  saveSettings();
});
document.getElementById("appearance-controls").addEventListener("input", (event) => {
  if (!APPEARANCE_CONTROLS.some(({ inputId }) => inputId === event.target.id)) return;
  render();
  saveSettings();
});

document.getElementById("groups").addEventListener("input", (event) => {
  const row = event.target.closest(".route-row");
  if (!row || event.target.tagName !== "INPUT") return;
  routes[Number(row.dataset.group)][Number(row.dataset.route)][0] = event.target.value;
  render();
  saveSettings();
});

document.getElementById("groups").addEventListener("change", (event) => {
  const row = event.target.closest(".route-row");
  if (!row || event.target.tagName !== "SELECT") return;
  routes[Number(row.dataset.group)][Number(row.dataset.route)][1] = event.target.value;
  render();
  saveSettings();
});

document.getElementById("groups").addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    const groupIndex = Number(addButton.dataset.add);
    routes[groupIndex].push(["Cung đường mới", "box"]);
    renderEditor();
    render();
    saveSettings();
    const rows = document.querySelectorAll(`.route-row[data-group="${groupIndex}"] input`);
    rows[rows.length - 1].focus();
    rows[rows.length - 1].select();
    return;
  }

  const removeButton = event.target.closest(".remove");
  if (removeButton) {
    const row = removeButton.closest(".route-row");
    routes[Number(row.dataset.group)].splice(Number(row.dataset.route), 1);
    renderEditor();
    render();
    saveSettings();
  }
});

document.getElementById("choose-background").addEventListener("click", () => {
  document.getElementById("background-file").click();
});

document.getElementById("export-settings").addEventListener("click", () => {
  const file = new Blob([JSON.stringify(currentSettings(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.download = "trekking-settings.json";
  link.href = URL.createObjectURL(file);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

document.getElementById("import-settings").addEventListener("click", () => {
  document.getElementById("settings-file").click();
});

document.getElementById("settings-file").addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const settings = validateSettings(JSON.parse(await file.text()));
    applySettings(settings);
    renderEditor();
    render();
    if (persistenceAvailable) {
      await writeSettingsToServer(settings);
      document.getElementById("save-state").textContent = "Đã nhập và lưu vào config/settings.json.";
    } else {
      document.getElementById("save-state").textContent =
        "Đã nhập JSON. Để lưu vào repo, hãy mở editor bằng python server.py.";
    }
  } catch (error) {
    document.getElementById("save-state").textContent = `Không thể nhập file JSON: ${error.message}`;
  } finally {
    event.target.value = "";
  }
});

document.getElementById("background-file").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (backgroundObjectUrl) URL.revokeObjectURL(backgroundObjectUrl);
  backgroundObjectUrl = URL.createObjectURL(file);
  peakImage.src = backgroundObjectUrl;
});

document.getElementById("download").addEventListener("click", async () => {
  setStatus("Đang dựng PNG từ HTML/CSS...");
  try {
    const blob = await renderPosterPng();
    const link = document.createElement("a");
    link.download = "trekking-infographic.png";
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setStatus("Đã tải trekking-infographic.png");
  } catch (error) {
    const suggestion = location.protocol === "file:"
      ? " Hãy chạy python server.py và mở http://127.0.0.1:8765 để xuất PNG."
      : "";
    setStatus(`Không thể tạo ảnh PNG: ${error.message}.${suggestion}`);
  }
});

peakImage.addEventListener("load", () => {
  setStatus("");
  render();
});
peakImage.addEventListener("error", () => {
  setStatus("Không tải được assets/6peaks.png. Hãy kiểm tra file hoặc chọn ảnh nền phần trên.");
  render();
});
criteriaLabel.addEventListener("error", () => {
  setStatus("Không tải được assets/criteria-label.png. Hãy kiểm tra file nhãn tiêu chí.");
});
ensureCriteriaLabelTransparency().catch((error) => {
  setStatus(`Không thể làm trong suốt nền nhãn tiêu chí: ${error.message}`);
});
window.addEventListener("resize", updatePreviewScale);
loadSettings();
renderEditor();
render();
