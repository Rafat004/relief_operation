"use client";

import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface-container-lowest text-outline font-mono-code">
      Initializing Topographic Engine...
    </div>
  ),
});

export default DynamicMap;
