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
    const filterId = `glow-${Math.random().toString(36).substr(2, 9)}`;
    const blurStdDev = lineWidth * (1 + pulseAmount * 2);
    return /* @__PURE__ */ jsxDEV("g", { style: { mixBlendMode: "screen" }, children: [
      /* @__PURE__ */ jsxDEV("defs", { children: [
        /* @__PURE__ */ jsxDEV("filter", { id: filterId, x: "-50%", y: "-50%", width: "200%", height: "200%", children: [
          /* @__PURE__ */ jsxDEV("feGaussianBlur", { in: "SourceGraphic", stdDeviation: blurStdDev, result: "blur" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 30,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("feColorMatrix", { in: "blur", type: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7", result: "goo" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 31,
            columnNumber: 25
          }),
          /* @__PURE__ */ jsxDEV("feComposite", { in: "SourceGraphic", in2: "goo", operator: "atop" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 32,
            columnNumber: 25
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 29,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("filter", { id: `${filterId}-simple`, x: "-100%", y: "-100%", width: "300%", height: "300%", children: [
          /* @__PURE__ */ jsxDEV("feGaussianBlur", { in: "SourceGraphic", stdDeviation: blurStdDev * 1.5, result: "blurOut" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 36,
            columnNumber: 26
          }),
          /* @__PURE__ */ jsxDEV("feGaussianBlur", { in: "SourceGraphic", stdDeviation: blurStdDev * 0.5, result: "blurIn" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 37,
            columnNumber: 26
          }),
          /* @__PURE__ */ jsxDEV("feMerge", { children: [
            /* @__PURE__ */ jsxDEV("feMergeNode", { in: "blurOut" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 39,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("feMergeNode", { in: "blurIn" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 40,
              columnNumber: 29
            }),
            /* @__PURE__ */ jsxDEV("feMergeNode", { in: "SourceGraphic" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 41,
              columnNumber: 29
            })
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 38,
            columnNumber: 26
          })
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 35,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 28,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV(
        "path",
        {
          d: customPath,
          stroke: baseColor,
          strokeWidth: lineWidth,
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          filter: `url(#${filterId}-simple)`,
          style: { opacity: 0.8 + 0.2 * pulseAmount }
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
      lineNumber: 27,
      columnNumber: 13
    });
  }
  const outerRadius = radius + lineWidth;
  const innerRadius = radius - lineWidth / 2;
  const pulseExtentOuter = outerRadius * (1 + pulseAmount * 0.8);
  const pulseExtentInner = Math.max(0, innerRadius * (1 - pulseAmount * 0.6));
  const gradOuterId = `grad-outer-${Math.random()}`;
  const gradInnerId = `grad-inner-${Math.random()}`;
  const glowColor = getTransparentColor(pulseAmount * 0.5);
  const glowMidColor = getTransparentColor(pulseAmount * 0.2);
  const glowInnerColor = getTransparentColor(pulseAmount * 0.4);
  return /* @__PURE__ */ jsxDEV("g", { style: { mixBlendMode: "screen" }, children: [
    /* @__PURE__ */ jsxDEV("defs", { children: [
      /* @__PURE__ */ jsxDEV("radialGradient", { id: gradOuterId, cx: "0", cy: "0", r: pulseExtentOuter, gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxDEV("stop", { offset: `${outerRadius / pulseExtentOuter}`, stopColor: glowColor }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 80,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${outerRadius / pulseExtentOuter + 0.2}`, stopColor: glowMidColor }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 81,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 82,
          columnNumber: 22
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 79,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("radialGradient", { id: gradInnerId, cx: "0", cy: "0", r: innerRadius, gradientUnits: "userSpaceOnUse", children: [
        /* @__PURE__ */ jsxDEV("stop", { offset: `${pulseExtentInner / innerRadius}`, stopColor: "rgba(0,0,0,0)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 85,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: `${pulseExtentInner / innerRadius + 0.5}`, stopColor: getTransparentColor(pulseAmount * 0.1) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 86,
          columnNumber: 22
        }),
        /* @__PURE__ */ jsxDEV("stop", { offset: "1", stopColor: glowInnerColor }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 87,
          columnNumber: 22
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 84,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 78,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: pulseExtentOuter, fill: `url(#${gradOuterId})` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 92,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("circle", { cx: "0", cy: "0", r: innerRadius, fill: `url(#${gradInnerId})` }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 95,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 77,
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
        lineNumber: 150,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("path", { d: trackPath, stroke: colors.secondary, strokeWidth: lineWidth, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 153,
        columnNumber: 18
      }),
      targetPath && /* @__PURE__ */ jsxDEV("path", { d: targetPath, stroke: targetColor || colors.success, strokeWidth: lineWidth * 0.95, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 157,
        columnNumber: 22
      }),
      /* @__PURE__ */ jsxDEV("circle", { cx: cursorP.x, cy: cursorP.y, r: lineWidth / 2, fill: colors.fail }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 161,
        columnNumber: 18
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 149,
      columnNumber: 13
    });
  }
  return /* @__PURE__ */ jsxDEV("svg", { viewBox: "-75 -75 150 150", style: { width: "100%", height: "100%" }, children: [
    /* @__PURE__ */ jsxDEV(Visualizer, { pulseAmount, targetColor, radius, lineWidth }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 169,
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
        lineNumber: 171,
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
        lineNumber: 180,
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
        lineNumber: 190,
        columnNumber: 17
      }
    ) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 189,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 168,
    columnNumber: 9
  });
};
export {
  GameCanvas,
  Visualizer
};
