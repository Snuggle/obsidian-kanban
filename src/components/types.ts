import { TFile } from "obsidian";
import { KanbanSettings } from "src/Settings";

export interface LaneData {
  shouldMarkItemsComplete?: boolean;
}

export interface Lane {
  id: string;
  title: string;
  data: LaneData;
  items: Item[];
}

export interface ItemData {
  isComplete?: boolean;
}

export interface DataKey {
  id: string;
  metadataKey: string;
  label: string;
  shouldHideLabel: boolean;
  containsMarkdown: boolean;
}

export interface PageData extends DataKey {
  value: string | number | Array<string | number>;
}

export interface FileMetadata {
  [k: string]: PageData;
}

export interface ItemMetaData {
  date?: moment.Moment;
  time?: moment.Moment;
  tags?: string[];
  file?: TFile | null;
  fileMetadata?: FileMetadata;
}

export interface Item {
  id: string;
  title: string;
  titleRaw: string;
  titleSearch: string;
  metadata: ItemMetaData;
  data: ItemData;
  dom: HTMLDivElement;
}

export interface Board {
  isSearching: boolean;
  settings: KanbanSettings;
  lanes: Lane[];
  archive: Item[];
}