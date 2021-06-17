import React from "react";
import { CSS } from "@dnd-kit/utilities";

import { Item } from "../types";
import { c } from "../helpers";
import { ObsidianContext } from "../context";
import { ItemContent, ItemMetadata } from "./ItemContent";
import { useItemMenu } from "./ItemMenu";
import {
  constructDatePicker,
  constructMenuDatePickerOnChange,
  constructMenuTimePickerOnChange,
  constructTimePicker,
  getItemClassModifiers,
} from "./helpers";
import { KanbanView } from "src/KanbanView";
import { BoardModifiers } from "../helpers/boardModifiers";
import { useSortable } from "@dnd-kit/sortable";
import { ItemCheckbox } from "./ItemCheckbox";
import { ItemMenuButton } from "./ItemMenuButton";

interface UseItemContentEventsParams {
  view: KanbanView;
  boardModifiers: BoardModifiers;
  laneIndex: number;
  itemIndex: number;
  item: Item;
}

function useItemContentEvents({
  boardModifiers,
  laneIndex,
  itemIndex,
  item,
  view,
}: UseItemContentEventsParams) {
  return React.useMemo(() => {
    const onContentChange: React.ChangeEventHandler<HTMLTextAreaElement> = (
      e
    ) => {
      const titleRaw = e.target.value.replace(/[\r\n]+/g, " ");
      boardModifiers.updateItem(
        laneIndex,
        itemIndex,
        view.parser.updateItem(item, titleRaw)
      );
    };

    const onEditDate: React.MouseEventHandler = (e) => {
      constructDatePicker(
        { x: e.clientX, y: e.clientY },
        constructMenuDatePickerOnChange({
          view,
          boardModifiers,
          item,
          hasDate: true,
          laneIndex,
          itemIndex,
        }),
        item.metadata.date?.toDate()
      );
    };

    const onEditTime: React.MouseEventHandler = (e) => {
      constructTimePicker(
        view,
        { x: e.clientX, y: e.clientY },
        constructMenuTimePickerOnChange({
          view,
          boardModifiers,
          item,
          hasTime: true,
          laneIndex,
          itemIndex,
        }),
        item.metadata.time
      );
    };

    return {
      onContentChange,
      onEditDate,
      onEditTime,
    };
  }, [boardModifiers, laneIndex, itemIndex, item, view]);
}

export interface DraggableItemProps {
  item: Item;
  itemIndex: number;
  shouldMarkItemsComplete: boolean;
  laneIndex: number;
}

export const DraggableItem = React.memo(function DraggableItem({
  item,
  itemIndex,
  laneIndex,
  shouldMarkItemsComplete,
}: DraggableItemProps) {
  const { view, boardModifiers, query } = React.useContext(ObsidianContext);
  const [isEditing, setIsEditing] = React.useState(false);
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: item.id,
    data: {
      itemIndex,
      laneIndex,
      type: "item",
    },
  });

  const isMatch = query ? item.titleSearch.contains(query) : false;
  const classModifiers: string[] = getItemClassModifiers(item);

  if (isDragging) classModifiers.push("is-dragging");

  if (query) {
    if (isMatch) {
      classModifiers.push("is-search-hit");
    } else {
      classModifiers.push("is-search-miss");
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const showItemMenu = useItemMenu({
    boardModifiers,
    item,
    itemIndex,
    laneIndex,
    setIsEditing,
    view,
  });

  const contentEvents = useItemContentEvents({
    boardModifiers,
    item,
    itemIndex,
    laneIndex,
    view,
  });

  const onContextMenu: React.MouseEventHandler = React.useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const internalLinkPath =
        e.target instanceof HTMLAnchorElement &&
        e.target.hasClass("internal-link")
          ? e.target.dataset.href
          : undefined;

      showItemMenu(e.nativeEvent, internalLinkPath);
    },
    [showItemMenu]
  );

  const onDoubleClick: React.MouseEventHandler = React.useCallback(() => {
    setIsEditing(true);
  }, [setIsEditing]);

  return (
    <div
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      className={`${c("item")} ${classModifiers.join(" ")}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className={c("item-content-wrapper")}>
        <div className={c("item-title-wrapper")}>
          <ItemCheckbox
            boardModifiers={boardModifiers}
            item={item}
            itemIndex={itemIndex}
            laneIndex={laneIndex}
            shouldMarkItemsComplete={shouldMarkItemsComplete}
            view={view}
          />
          <ItemContent
            isSettingsVisible={isEditing}
            item={item}
            onChange={contentEvents.onContentChange}
            onEditDate={contentEvents.onEditDate}
            onEditTime={contentEvents.onEditTime}
            searchQuery={isMatch ? query : undefined}
            setIsSettingsVisible={setIsEditing}
          />
          <ItemMenuButton
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            showMenu={showItemMenu}
          />
        </div>
        <ItemMetadata
          searchQuery={isMatch ? query : undefined}
          isSettingsVisible={isEditing}
          item={item}
        />
      </div>
    </div>
  );
});
