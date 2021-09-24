import * as TE from "fp-ts/lib/TaskEither";
import * as RD from "@devexperts/remote-data-ts";
import { useState, useEffect } from "react";

export const useRemoteData = <E, A>(task: TE.TaskEither<E, A>): RD.RemoteData<E, A> => {
  const [data, setData] = useState<RD.RemoteData<E,A>>(RD.pending);
  useEffect(() => {
    let isActive = true;
    setData(RD.pending);
    task().then(data => {
      if (isActive) {
        setData(RD.fromEither(data));
      }
    });
    return () => {
      isActive = false;
    };
  }, [task]);
  return data;
}

