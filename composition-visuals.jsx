import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { color } from "d3-color";
const Visualizer = ({ pulseAmount, targetColor, radius, lineWidth, customPath }) => {
  if (!pulseAmount || pulseAmount <= 0.01) {
    return null;
  }
  const c = color(targetColor);
  const baseColor = c ? c.formatRgb() : targetColor;
  const getTransparentColor = (opacity) => {
    if (!c) return baseColor;
    const tc = c.copy();
    tc.opacity = opacity;
    return tc.formatRgb();
  };
  if (customPath) {
    return /* @__PURE__ */ jsxDEV("g", { style: { mixBlendMode: "screen" }, children: [
      /* @__PURE__ */ jsxDEV(
        "path",
        {
          d: customPath,
          stroke: baseColor,
          strokeWidth: lineWidth * (4 + pulseAmount * 6),
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          style: { opacity: 0.05 * pulseAmount }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 26,
          columnNumber: 18
        }
      ),
      /* @__PURE__ */ jsxDEV(
        "path",
        {
          d: customPath,
          stroke: baseColor,
          strokeWidth: lineWidth * (2 + pulseAmount * 3),
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          style: { opacity: 0.15 * pulseAmount }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 36,
          columnNumber: 18
        }
      ),
      /* @__PURE__ */ jsxDEV(
        "path",
        {
          d: customPath,
          stroke: baseColor,
          strokeWidth: lineWidth * (1 + pulseAmount),
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          style: { opacity: 0.4 * pulseAmount }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 46,
          columnNumber: 18
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 24,
      columnNumber: 13
    });
  }
  const maxRadius = radius * (1.5 + pulseAmount * 0.5);
  const gradId = `grad-pulse-${Math.random()}`;
  const trackRatio = radius / maxRadius;
  const spread = 0.15 + 0.1 * pulseAmount;
  const peakColor = getTransparentColor(0.6 * pulseAmount);
  return /* @__PURE__ */ jsxDEV("g", { style: { mixBlendMode: "screen" }, children: [
    /* @__PURE__ */ jsxDEV("defs", { children: /* @__PURE__ */ jsxDEV("radialGradient", { id: gradId, cx: "0", cy: "0", r: maxRadius, gradientUnits: "userSpaceOnUse", children: [
      /* @__PURE__ */ jsxDEV("stop", { offset: "0", stopColor: "rgba(0,0,0,0)" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 74,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("stop", { offset: `${Math.max(0, trackRatio - spread)}`, stopColor: "rgba(0,0,0,0)" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 75,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("stop", { offset: `${trackRatio}`, stopColor: peakColor }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 76,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("stop", { offset: `${Math.min(1, trackRatio + spread)}`, stopColor: "rgba(0,0,0,0)" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 77,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: "rgba(0,0,0,0)" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 78,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 73,
      columnNumber: 17
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 72,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: maxRadius, fill: `url(#${gradId})` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 81,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 71,
    columnNumber: 9
  });
};
const getIndex = (ang, len) => {
  const norm = (ang % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const progress = norm / (Math.PI * 2);
  const idx = Math.floor(progress * (len - 1));
  return Math.max(0, Math.min(len - 1, idx));
};
const GameCanvas = ({ frameData, config }) => {
  const { angle, targetStartAngle, targetSize, success, fail, targetColor, pulseAmount } = frameData;
  const { difficulty, difficulties, colors, mode, customMapData } = config;
  const { trackWidthFactor } = difficulties[difficulty] || difficulties["easy"];
  const radius = 45;
  const lineWidth = radius * 2 * trackWidthFactor;
  if (mode === "custom" && customMapData && customMapData.points) {
    const scale = 100;
    const points = customMapData.points.map((p) => ({ x: p.x * scale, y: p.y * scale }));
    const len = points.length;
    const trackPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    let targetPath = "";
    if (targetSize > 0) {
      const startIdx = getIndex(targetStartAngle, len);
      const endAngle = targetStartAngle + targetSize;
      if (endAngle > Math.PI * 2) {
        const realEndIdx = getIndex(endAngle % (Math.PI * 2), len);
        targetPath += points.slice(startIdx).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
        targetPath += points.slice(1, realEndIdx + 1).map((p) => ` L ${p.x} ${p.y}`).join(" ");
      } else {
        const endIdx = getIndex(endAngle, len);
        targetPath = points.slice(startIdx, endIdx + 1).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      }
    }
    const cursorIdx = getIndex(angle, len);
    const cursorP = points[cursorIdx] || { x: 0, y: 0 };
    return /* @__PURE__ */ jsxDEV("svg", { viewBox: "-75 -75 150 150", style: { width: "100%", height: "100%" }, children: [
      /* @__PURE__ */ jsxDEV(Visualizer, { pulseAmount, targetColor, radius, lineWidth, customPath: trackPath }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 136,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("path", { d: trackPath, stroke: colors.secondary, strokeWidth: lineWidth, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 139,
        columnNumber: 18
      }),
      targetPath && /* @__PURE__ */ jsxDEV("path", { d: targetPath, stroke: targetColor || colors.success, strokeWidth: lineWidth * 0.95, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 143,
        columnNumber: 22
      }),
      /* @__PURE__ */ jsxDEV("circle", { cx: cursorP.x, cy: cursorP.y, r: lineWidth / 2, fill: colors.fail }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 147,
        columnNumber: 18
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 135,
      columnNumber: 13
    });
  }
  return /* @__PURE__ */ jsxDEV("svg", { viewBox: "-75 -75 150 150", style: { width: "100%", height: "100%" }, children: [
    /* @__PURE__ */ jsxDEV(Visualizer, { pulseAmount, targetColor, radius, lineWidth }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 155,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV(
      "circle",
      {
        cx: "0",
        cy: "0",
        r: radius,
        fill: "none",
        stroke: colors.secondary,
        strokeWidth: lineWidth,
        strokeLinecap: "butt"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 157,
        columnNumber: 13
      }
    ),
    targetSize > 0 && /* @__PURE__ */ jsxDEV(
      "path",
      {
        d: `M ${radius * Math.cos(targetStartAngle)} ${radius * Math.sin(targetStartAngle)} A ${radius} ${radius} 0 0 1 ${radius * Math.cos(targetStartAngle + targetSize)} ${radius * Math.sin(targetStartAngle + targetSize)}`,
        fill: "none",
        stroke: targetColor || colors.success,
        strokeWidth: lineWidth * 0.95,
        strokeLinecap: "round"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 166,
        columnNumber: 17
      }
    ),
    /* @__PURE__ */ jsxDEV("g", { transform: `rotate(${angle * 180 / Math.PI + 90})`, children: /* @__PURE__ */ jsxDEV(
      "line",
      {
        x1: "0",
        y1: -(radius - lineWidth / 2),
        x2: "0",
        y2: -(radius + lineWidth / 2),
        stroke: colors.fail,
        strokeWidth: lineWidth / 2.5,
        strokeLinecap: "butt"
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 176,
        columnNumber: 17
      }
    ) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 175,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 154,
    columnNumber: 9
  });
};
export {
  GameCanvas,
  Visualizer
};
