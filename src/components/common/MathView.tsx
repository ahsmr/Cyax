// HELPER FUNCTION DON'T MODIFY
import React, { useMemo } from "react";
import katex from "katex";

interface MathViewProps {
  math: string;
  displayMode?: boolean; // false = inline math, true = block math
}

export const MathView: React.FC<MathViewProps> = ({
  math,
  displayMode = false,
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false, // Prevents app crashes if there's invalid LaTeX syntax
      });
    } catch (e) {
      console.error("KaTeX rendering error:", e);
      return math;
    }
  }, [math, displayMode]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};
