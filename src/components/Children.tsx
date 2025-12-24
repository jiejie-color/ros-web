import { useEffect } from "react";

export const Children = ({
  mySetCount,
}: {
  mySetCount: (pre: React.SetStateAction<number>) => void;
}) => {
  useEffect(() => {
    mySetCount((pre) => pre + 1);
  }, [mySetCount]);
  return (
    <div style={{ width: "100%", height: "100%", background: "#f0f0f0" }}>
      {"Children"}
      {/* <button onClick={() => mySetCount((prev) => prev + 1)}> */}
      {"Increment"}
      {/* </button> */}
    </div>
  );
};
