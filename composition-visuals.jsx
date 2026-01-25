import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const Visualizer = ({ pulseAmount, targetColor, radius, lineWidth, customPath }) => {
  if (!pulseAmount || pulseAmount <= 0.01) {
    return null;
  }
  const baseColor = targetColor.replace("hsl", "hsla").replace(")", ",");
  if (customPath) {
    const glowRadius = lineWidth * 2 * (0.5 + pulseAmount);
    const intenseRadius = lineWidth * 0.5 * (0.5 + pulseAmount);
    return /* @__PURE__ */ jsxDEV("g", { style: { mixBlendMode: "screen" }, children: [
      /* @__PURE__ */ jsxDEV(
        "path",
        {
          d: customPath,
          stroke: baseColor,
          strokeWidth: lineWidth * 0.8,
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          style: {
            filter: `drop-shadow(0 0 ${glowRadius}px ${baseColor})`,
            opacity: Math.min(1, 0.2 + pulseAmount * 0.8)
          }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 18,
          columnNumber: 18
        }
      ),
      /* @__PURE__ */ jsxDEV(
        "path",
        {
          d: customPath,
          stroke: baseColor,
          strokeWidth: lineWidth * 0.6,
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          style: {
            filter: `drop-shadow(0 0 ${intenseRadius}px ${baseColor})`,
            opacity: Math.min(1, 0.3 + pulseAmount * 0.9)
          }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 18
        }
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 16,
      columnNumber: 13
    });
  }
  const outerRadius = radius + lineWidth / 2;
  const innerRadius = radius - lineWidth / 2;
  const pulseExtentOuter = outerRadius * (1 + pulseAmount * 0.8);
  const pulseExtentInner = Math.max(0, innerRadius * (1 - pulseAmount * 0.6));
  const gradOuterId = `grad-outer-${Math.random()}`;
  const gradInnerId = `grad-inner-${Math.random()}`;
  const glowColor = `${baseColor} ${pulseAmount * 0.5})`;
  const glowMidColor = `${baseColor} ${pulseAmount * 0.2})`;
  const glowInnerColor = `${baseColor} ${pulseAmount * 0.4})`;
  return /* @__PURE__ */ jsxDEV("g", { style: { mixBlendMode: "screen" }, children: [
    /* @__PURE__ */ jsxDEV("defs", { children: [
      /* @__PURE__ */ jsxDEV("radialGradient", { id: gradOuterId, cx: "0", cy: "0", r: pulseExtentOuter, gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxDEV("stop", { offset: `${outerRadius / pulseExtentOuter}`, stopColor: glowColor }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 67,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${outerRadius / pulseExtentOuter + 0.2}`, stopColor: glowMidColor }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 68,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 69,
          columnNumber: 22
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 66,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("radialGradient", { id: gradInnerId, cx: "0", cy: "0", r: innerRadius, gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxDEV("stop", { offset: `${pulseExtentInner / innerRadius}`, stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 72,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${pulseExtentInner / innerRadius + 0.5}`, stopColor: `${baseColor} ${pulseAmount * 0.1})` }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 73,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: glowInnerColor }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 74,
          columnNumber: 22
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 71,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 65,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: pulseExtentOuter, fill: `url(#${gradOuterId})` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 79,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: innerRadius, fill: `url(#${gradInnerId})` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 82,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 64,
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
        lineNumber: 137,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("path", { d: trackPath, stroke: colors.secondary, strokeWidth: lineWidth, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 140,
        columnNumber: 18
      }),
      targetPath && /* @__PURE__ */ jsxDEV("path", { d: targetPath, stroke: targetColor || colors.success, strokeWidth: lineWidth * 0.95, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 144,
        columnNumber: 22
      }),
      /* @__PURE__ */ jsxDEV("circle", { cx: cursorP.x, cy: cursorP.y, r: lineWidth / 2, fill: colors.fail }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 148,
        columnNumber: 18
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 136,
      columnNumber: 13
    });
  }
  return /* @__PURE__ */ jsxDEV("svg", { viewBox: "-75 -75 150 150", style: { width: "100%", height: "100%" }, children: [
    /* @__PURE__ */ jsxDEV(Visualizer, { pulseAmount, targetColor, radius, lineWidth }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 156,
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
        lineNumber: 158,
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
        lineNumber: 167,
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
        lineNumber: 177,
        columnNumber: 17
      }
    ) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 176,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 155,
    columnNumber: 9
  });
};
export {
  GameCanvas,
  Visualizer
};
