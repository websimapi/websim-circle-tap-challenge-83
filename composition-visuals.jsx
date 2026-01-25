import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
const Visualizer = ({ pulseAmount, targetColor, radius, lineWidth, customPath }) => {
  if (!pulseAmount || pulseAmount <= 0.01) {
    return null;
  }
  const baseColor = targetColor.replace("hsl", "hsla").replace(")", ",");
  if (customPath) {
    const gradBloomId = `grad-bloom-${Math.random()}`;
    const bloomRadius = radius * 2.5;
    const faintColor = `${baseColor} ${pulseAmount * 0.15})`;
    const medColor = `${baseColor} ${pulseAmount * 0.25})`;
    const coreColor = `${baseColor} ${pulseAmount * 0.4})`;
    const w1 = lineWidth + pulseAmount * 60;
    const w2 = lineWidth + pulseAmount * 30;
    const w3 = lineWidth + pulseAmount * 8;
    return /* @__PURE__ */ jsxDEV("g", { style: { mixBlendMode: "screen" }, children: [
      /* @__PURE__ */ jsxDEV("defs", { children: /* @__PURE__ */ jsxDEV("radialGradient", { id: gradBloomId, cx: "0", cy: "0", r: bloomRadius, gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxDEV("stop", { offset: "0", stopColor: `${baseColor} 0)` }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 28,
          columnNumber: 26
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "0.5", stopColor: `${baseColor} ${pulseAmount * 0.15})` }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 29,
          columnNumber: 26
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: `${baseColor} 0)` }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 30,
          columnNumber: 26
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 27,
        columnNumber: 21
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 26,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: bloomRadius, fill: `url(#${gradBloomId})` }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 35,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("path", { d: customPath, stroke: faintColor, strokeWidth: w1, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 37,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("path", { d: customPath, stroke: medColor, strokeWidth: w2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 38,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("path", { d: customPath, stroke: coreColor, strokeWidth: w3, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 39,
        columnNumber: 18
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 25,
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
          lineNumber: 64,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${outerRadius / pulseExtentOuter + 0.2}`, stopColor: glowMidColor }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 65,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 66,
          columnNumber: 22
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 63,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("radialGradient", { id: gradInnerId, cx: "0", cy: "0", r: innerRadius, gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxDEV("stop", { offset: `${pulseExtentInner / innerRadius}`, stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 69,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${pulseExtentInner / innerRadius + 0.5}`, stopColor: `${baseColor} ${pulseAmount * 0.1})` }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 70,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: glowInnerColor }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 71,
          columnNumber: 22
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 68,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 62,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: pulseExtentOuter, fill: `url(#${gradOuterId})` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 76,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: innerRadius, fill: `url(#${gradInnerId})` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 79,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 61,
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
        lineNumber: 134,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("path", { d: trackPath, stroke: colors.secondary, strokeWidth: lineWidth, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 137,
        columnNumber: 18
      }),
      targetPath && /* @__PURE__ */ jsxDEV("path", { d: targetPath, stroke: targetColor || colors.success, strokeWidth: lineWidth * 0.95, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 141,
        columnNumber: 22
      }),
      /* @__PURE__ */ jsxDEV("circle", { cx: cursorP.x, cy: cursorP.y, r: lineWidth / 2, fill: colors.fail }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 145,
        columnNumber: 18
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 133,
      columnNumber: 13
    });
  }
  return /* @__PURE__ */ jsxDEV("svg", { viewBox: "-75 -75 150 150", style: { width: "100%", height: "100%" }, children: [
    /* @__PURE__ */ jsxDEV(Visualizer, { pulseAmount, targetColor, radius, lineWidth }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 153,
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
        lineNumber: 155,
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
        lineNumber: 164,
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
        lineNumber: 174,
        columnNumber: 17
      }
    ) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 173,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 152,
    columnNumber: 9
  });
};
export {
  GameCanvas,
  Visualizer
};
