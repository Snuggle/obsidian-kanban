import React from "react";
import { KanbanView } from "src/KanbanView";
import { BoardModifiers } from "./helpers/boardModifiers";
import { Board } from "./types";

export interface ObsidianContextProps {
  filePath?: string;
  view?: KanbanView;
  boardModifiers:  BoardModifiers;
  query: string;
  setBoardData: React.Dispatch<React.SetStateAction<Board>>
}

export const ObsidianContext = React.createContext<ObsidianContextProps>(null);



