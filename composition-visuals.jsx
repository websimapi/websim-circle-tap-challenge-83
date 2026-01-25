import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const Visualizer = ({ pulseAmount, targetColor, radius, lineWidth }) => {
  if (!pulseAmount || pulseAmount <= 0.1) {
    return null;
  }
  const outerRadius = radius + lineWidth / 2;
  const innerRadius = radius - lineWidth / 2;
  const maxOuterPulse = lineWidth * 0.8;
  const pulseOuterRadius = outerRadius + pulseAmount * maxOuterPulse;
  const maxInnerPulse = innerRadius * 0.7;
  const pulseInnerRadius = innerRadius - pulseAmount * maxInnerPulse;
  const pulseColorRgba = targetColor.replace("hsl", "hsla").replace(")", `, ${pulseAmount * 0.3})`);
  const outerGradientId = `outerPulseGradient-${Math.random()}`;
  const innerGradientId = `innerPulseGradient-${Math.random()}`;
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("defs", { children: [
      /* @__PURE__ */ jsxDEV("radialGradient", { id: outerGradientId, cx: "0", cy: "0", r: pulseOuterRadius, gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxDEV("stop", { offset: 0, stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 26,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${outerRadius / pulseOuterRadius * 0.8}`, stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 27,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${outerRadius / pulseOuterRadius * 0.95}`, stopColor: pulseColorRgba }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 28,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 29,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 25,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("radialGradient", { id: innerGradientId, cx: "0", cy: "0", r: innerRadius, gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxDEV("stop", { offset: 0, stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 32,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${pulseInnerRadius / innerRadius}`, stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 33,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${pulseInnerRadius / innerRadius * 1.25}`, stopColor: pulseColorRgba }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 34,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 35,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 31,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 24,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("rect", { x: "-55", y: "-55", width: "110", height: "110", fill: `url(#${outerGradientId})` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 38,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("rect", { x: "-55", y: "-55", width: "110", height: "110", fill: `url(#${innerGradientId})` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 39,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 23,
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
    return /* @__PURE__ */ jsxDEV("svg", { viewBox: "-55 -55 110 110", style: { width: "100%", height: "100%" }, children: [
      /* @__PURE__ */ jsxDEV(Visualizer, { pulseAmount, targetColor, radius, lineWidth }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 94,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("path", { d: trackPath, stroke: colors.secondary, strokeWidth: lineWidth, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 97,
        columnNumber: 18
      }),
      targetPath && /* @__PURE__ */ jsxDEV("path", { d: targetPath, stroke: targetColor || colors.success, strokeWidth: lineWidth * 0.95, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 101,
        columnNumber: 22
      }),
      /* @__PURE__ */ jsxDEV("circle", { cx: cursorP.x, cy: cursorP.y, r: lineWidth / 2, fill: colors.fail }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 105,
        columnNumber: 18
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 93,
      columnNumber: 13
    });
  }
  return /* @__PURE__ */ jsxDEV("svg", { viewBox: "-55 -55 110 110", style: { width: "100%", height: "100%" }, children: [
    /* @__PURE__ */ jsxDEV(Visualizer, { pulseAmount, targetColor, radius, lineWidth }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 113,
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
        lineNumber: 115,
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
        lineNumber: 124,
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
        lineNumber: 134,
        columnNumber: 17
      }
    ) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 133,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 112,
    columnNumber: 9
  });
};
export {
  GameCanvas,
  Visualizer
};
