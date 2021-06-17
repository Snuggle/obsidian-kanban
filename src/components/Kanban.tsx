import update from "immutability-helper";
import React from "react";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { DataBridge } from "../DataBridge";
import { Board } from "./types";
import { c, baseClassName } from "./helpers";
import { DraggableLane } from "./Lane/Lane";
import { LaneForm } from "./Lane/LaneForm";
import { ObsidianContext } from "./context";
import { KanbanView } from "src/KanbanView";
import { frontMatterKey } from "../parser";
import { t } from "src/lang/helpers";
import { Icon } from "./Icon/Icon";
import { getBoardModifiers } from "./helpers/boardModifiers";
import { useDroppable } from "@dnd-kit/core";

function useBoardEventHandlers(view: KanbanView, filePath: string) {
  return React.useMemo(
    () => ({
      onMouseOver: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const targetEl = e.target as HTMLElement;

        if (targetEl.tagName !== "A") return;

        if (targetEl.hasClass("internal-link")) {
          view.app.workspace.trigger("hover-link", {
            event: e.nativeEvent,
            source: frontMatterKey,
            hoverParent: view,
            targetEl,
            linktext: targetEl.getAttr("href"),
            sourcePath: view.file.path,
          });
        }
      },
      onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const targetEl = e.target as HTMLElement;

        if (targetEl.tagName !== "A") return;

        // Open an internal link in a new pane
        if (targetEl.hasClass("internal-link")) {
          e.preventDefault();

          view.app.workspace.openLinkText(
            targetEl.getAttr("href"),
            filePath,
            e.ctrlKey || e.metaKey
          );

          return;
        }

        // Open a tag search
        if (targetEl.hasClass("tag")) {
          e.preventDefault();

          (view.app as any).internalPlugins
            .getPluginById("global-search")
            .instance.openGlobalSearch(`tag:${targetEl.getAttr("href")}`);

          return;
        }

        // Open external link
        if (targetEl.hasClass("external-link")) {
          e.preventDefault();
          window.open(targetEl.getAttr("href"), "_blank");
        }
      },
    }),
    [view, filePath]
  );
}

interface SearchProps {
  view: KanbanView;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchRef: React.MutableRefObject<HTMLInputElement>;
}

function Search({ view, searchRef, searchQuery, setSearchQuery }: SearchProps) {
  return (
    <div className={c("search-wrapper")}>
      <input
        ref={searchRef}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSearchQuery("");
            (e.target as HTMLInputElement).blur();
            view.toggleSearch();
          }
        }}
        type="text"
        className={c("filter-input")}
        placeholder={t("Search...")}
      />
      <button
        className={c("search-cancel-button")}
        onClick={() => {
          setSearchQuery("");
          view.toggleSearch();
        }}
        aria-label={t("Cancel")}
      >
        <Icon name="cross" />
      </button>
    </div>
  );
}

interface KanbanProps {
  dataBridge: DataBridge<Board>;
  view: KanbanView;
}

export const Kanban = ({ view, dataBridge }: KanbanProps) => {
  const [boardData, setBoardData] = dataBridge.useState();
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const searchRef = React.useRef<HTMLInputElement>();

  const filePath = view.file?.path;
  const maxArchiveLength = view.getSetting("max-archive-size");

  React.useEffect(() => {
    if (boardData.isSearching) {
      searchRef.current?.focus();
    }
  }, [boardData.isSearching]);

  React.useEffect(() => {
    if (maxArchiveLength === undefined || maxArchiveLength === -1) {
      return;
    }

    if (
      typeof maxArchiveLength === "number" &&
      boardData.archive.length > maxArchiveLength
    ) {
      setBoardData(
        update(boardData, {
          archive: {
            $set: boardData.archive.slice(maxArchiveLength * -1),
          },
        })
      );
    }
  }, [boardData.archive.length, maxArchiveLength]);

  const boardModifiers = React.useMemo(() => {
    return getBoardModifiers({ view, setBoardData });
  }, [view, setBoardData]);

  const boardContext = React.useMemo(
    () => ({
      view,
      filePath,
      boardModifiers,
      setBoardData,
      query: searchQuery.toLocaleLowerCase(),
    }),
    [view, setBoardData, boardModifiers, searchQuery, filePath]
  );

  const boardEventHandlers = useBoardEventHandlers(view, filePath);

  const { isOver, setNodeRef } = useDroppable({
    id: view.id,
    data: {
      boardContext
    }
  });

  // Don't render anything if there's no board
  if (!boardData) return null;

  return (
    <ObsidianContext.Provider value={boardContext}>
      {boardData.isSearching && (
        <Search
          view={view}
          searchRef={searchRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}
      <div className={baseClassName} {...boardEventHandlers}>
        <div className={c("board")} ref={setNodeRef}>
          <SortableContext
            items={boardData.lanes}
            strategy={horizontalListSortingStrategy}
          >
            {boardData.lanes.map((lane, i) => (
              <DraggableLane lane={lane} laneIndex={i} />
            ))}
          </SortableContext>
        </div>
      </div>
    </ObsidianContext.Provider>
  );
};
