import update from "immutability-helper";
import React from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Item, Lane } from "../types";
import { c, noop } from "../helpers";
import { DraggableItem } from "../Item/Item";
import { ItemForm } from "../Item/ItemForm";
import { LaneHeader } from "./LaneHeader";
import { ObsidianContext, ObsidianContextProps } from "../context";
import { useDroppable } from "@dnd-kit/core";
import { KanbanView } from "src/KanbanView";

interface LaneItemsProps {
  items: Item[];
  laneId: string;
  laneIndex: number;
  shouldMarkItemsComplete: boolean;
}

const LaneItems = React.memo(function LaneItems({
  items,
  laneId,
  laneIndex,
  shouldMarkItemsComplete,
}: LaneItemsProps) {
  const { isOver, over, setNodeRef } = useDroppable({
    id: laneId,
  });

  const classList = [c("lane-items")];

  if (isOver && over?.data.current?.type === "item") {
    classList.push("is-dragging-over");
  }

  return (
    <div className={classList.join(" ")} ref={setNodeRef}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item, i) => {
          return (
            <DraggableItem
              item={item}
              itemIndex={i}
              laneIndex={laneIndex}
              shouldMarkItemsComplete={shouldMarkItemsComplete}
            />
          );
        })}
      </SortableContext>
    </div>
  );
});

interface DraggableLaneProps {
  lane: Lane;
  laneIndex: number;
}

export const DraggableLane = ({ lane, laneIndex }: DraggableLaneProps) => {
    const context = React.useContext(ObsidianContext);
    const { view, boardModifiers } = context;

    const shouldMarkItemsComplete = !!lane.data.shouldMarkItemsComplete;
    const laneWidth = view.getSetting("lane-width");
    const settingStyles = laneWidth ? { width: `${laneWidth}px` } : undefined;

    const {
      over,
      index,
      overIndex,
      isSorting,
      isDragging,
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({
      id: lane.id,
      data: {
        context,
        laneIndex,
        type: "lane",
      },
    });

    const addItems = React.useCallback(
      (items: Item[]) => {
        boardModifiers.addItemsToLane(
          laneIndex,
          items.map((item) =>
            update(item, {
              data: {
                isComplete: {
                  // Mark the item complete if we're moving into a completed lane
                  $set: shouldMarkItemsComplete,
                },
              },
            })
          )
        );
      },
      [boardModifiers, laneIndex, shouldMarkItemsComplete]
    );

    const style = {
      transform: isSorting ? CSS.Transform.toString(transform) : undefined,
      transition,
    };

    const classList = [c("lane")];

    if (isDragging) {
      classList.push("is-placeholder");
    }

    if (overIndex === laneIndex) {
      classList.push("is-hovering");
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <div className={classList.join(" ")} style={settingStyles}>
          <LaneHeader
            dragHandleProps={listeners}
            laneIndex={laneIndex}
            lane={lane}
          />
          {/* <LaneItems
            laneId={lane.id}
            items={lane.items}
            laneIndex={laneIndex}
            shouldMarkItemsComplete={shouldMarkItemsComplete}
          />
          <ItemForm addItems={addItems} /> */}
        </div>
      </div>
    );
  }


export const DraggableLaneGhost = ({
    lane,
    laneIndex,
    context,
  }: DraggableLaneProps & { context: ObsidianContextProps }) => {
    const shouldMarkItemsComplete = !!lane.data.shouldMarkItemsComplete;
    const laneWidth = context.view.getSetting("lane-width");
    const settingStyles = laneWidth ? { width: `${laneWidth}px` } : undefined;

    const classList = [c("lane"), "is-dragging"];

    return (
      <ObsidianContext.Provider value={context}>
        <div className={classList.join(" ")} style={settingStyles}>
          <LaneHeader laneIndex={laneIndex} lane={lane} />
          {/* <LaneItems
            laneId={lane.id}
            items={lane.items}
            laneIndex={laneIndex}
            shouldMarkItemsComplete={shouldMarkItemsComplete}
          />
          <ItemForm addItems={noop} /> */}
        </div>
      </ObsidianContext.Provider>
    );
  }
