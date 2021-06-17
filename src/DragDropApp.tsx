import { App, Notice } from "obsidian";
import React from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  PointerSensor,
  useSensors,
  DragOverlay,
  LayoutMeasuringStrategy,
  closestCorners,
  rectIntersection,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { Board, Lane } from "./components/types";
import { DataBridge } from "./DataBridge";
import { KanbanView } from "./KanbanView";
import { DraggableLaneGhost } from "./components/Lane/Lane";
import { ObsidianContextProps } from "./components/context";
import { reorderLanes } from "./components/helpers";

export function createApp(
  app: App,
  dataBridge: DataBridge<Map<string, KanbanView>>
) {
  return <DragDropApp app={app} dataBridge={dataBridge} />;
}

const View = React.memo(({ view }: { view: KanbanView }) => {
  return createPortal(view.getPortal(), view.contentEl);
});

interface DragDropAppProps {
  app: App;
  dataBridge: DataBridge<Map<string, KanbanView>>;
}

const layoutMeasuring = {
  strategy: LayoutMeasuringStrategy.Always,
}

export function DragDropApp({ app, dataBridge }: DragDropAppProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [views, _] = dataBridge.useState();
  const portals: JSX.Element[] = [];
  const [laneGhost, setLaneGhost] =
    React.useState<{ context: ObsidianContextProps; laneIndex: number }>(null);

  views.forEach((view, key) => portals.push(<View key={key} view={view} />));

  if (portals.length)
    return (
      <DndContext
        sensors={sensors}
        onDragEnd={(args) => {
          const { active, over } = args
          // TODO: type these
          const source = active.data.current;
          const destination = over.data.current;
          console.log(args)

          setLaneGhost(null);

          if (source.type !== destination.type) {
            return;
          }

          if (source.context.view !== destination.context.view) {
            // TODO cross board drop
            return;
          }

          if (source.type === 'lane') {
            if (source.laneIndex === destination.laneIndex) {
              return;
            }

            console.log('setting data', source.laneIndex, destination.laneIndex)
            source.context.setBoardData(reorderLanes(source.laneIndex, destination.laneIndex))
          }
        }}
        onDragCancel={() => {
          setLaneGhost(null);
        }}
        onDragStart={({ active }) => {
          const dragging = active.data.current;

          if (dragging.type === "lane") {
            setLaneGhost({
              laneIndex: dragging.laneIndex,
              context: dragging.context,
            });
          }
        }}
      >
        {...portals}
        {createPortal(
          <DragOverlay>
            {laneGhost ? (
              <DraggableLaneGhost
                laneIndex={laneGhost.laneIndex}
                lane={
                  laneGhost.context.view.dataBridge.data.lanes[
                    laneGhost.laneIndex
                  ]
                }
                context={laneGhost.context}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    );

  // function onDragEnd(dropResult: DropResult) {
  //   // Bail out early if we're not dropping anywhere
  //   const { source, destination } = dropResult;
  //   if (!destination) return;

  //   const srcLoc = boardContextFor(dropResult, source.droppableId);
  //   const dstLoc = boardContextFor(dropResult, destination.droppableId);
  //   if (!srcLoc || !dstLoc)
  //     return new Notice("Invalid source or destination for drop");

  //   let srcMutator: helpers.BoardMutator;
  //   let dstMutator: helpers.BoardMutator;

  //   if (srcLoc.file !== dstLoc.file) {
  //     // Two different files
  //     if (dropResult.type === "LANE") {
  //       srcMutator = helpers.deleteLane(source.index);
  //       dstMutator = helpers.insertLane(
  //         destination.index,
  //         srcLoc.getData().lanes[source.index]
  //       );
  //     } else {
  //       const srcLane = srcLoc.getData().lanes[srcLoc.laneIndex];
  //       const dstLane = dstLoc.getData().lanes[dstLoc.laneIndex];
  //       const item = helpers.maybeCompleteForMove(
  //         srcLane.items[source.index],
  //         srcLane,
  //         dstLane
  //       );
  //       srcMutator = helpers.deleteItem(srcLoc.laneIndex, source.index);
  //       dstMutator = helpers.insertItem(
  //         dstLoc.laneIndex,
  //         destination.index,
  //         item
  //       );
  //     }
  //   } else {
  //     if (srcLoc.view !== dstLoc.view) {
  //       // drag between two views on the same file, might need to fudge position (due to the copy of src in dst)
  //       if (destination.index > source.index) --destination.index;
  //     }
  //     // Nominal case: same file, same view
  //     if (dropResult.type === "LANE") {
  //       // Swap lanes
  //       srcMutator = dstMutator = helpers.swapLanes(
  //         source.index,
  //         destination.index
  //       );
  //     } else if (srcLoc.laneIndex === dstLoc.laneIndex) {
  //       // Swap items within a lane
  //       srcMutator = dstMutator = helpers.swapItems(
  //         srcLoc.laneIndex,
  //         source.index,
  //         destination.index
  //       );
  //     } else {
  //       // Move item from one lane to another
  //       srcMutator = dstMutator = helpers.moveItem(
  //         srcLoc.laneIndex,
  //         source.index,
  //         dstLoc.laneIndex,
  //         destination.index
  //       );
  //       const lanes = srcLoc.getData().lanes;
  //       const item = lanes[srcLoc.laneIndex].items[source.index];
  //       app.workspace.trigger(
  //         "kanban:card-moved",
  //         srcLoc.file,
  //         lanes[srcLoc.laneIndex],
  //         lanes[dstLoc.laneIndex],
  //         item
  //       );
  //     }
  //   }

  //   // Apply changes at destination view first, so UI changes immediately
  //   //   (but only if there's more than one view involved)
  //   if (srcLoc.view !== dstLoc.view && dstMutator) {
  //     // if it's the same file+change, just update the display; the change will be saved
  //     //   when it's applied to the source, below.
  //     dstLoc.mutate(
  //       dstMutator,
  //       srcMutator === dstMutator && srcLoc.file === dstLoc.file
  //     );
  //   }

  //   // Apply changes to source (if any), and always save it
  //   if (srcMutator) srcLoc.mutate(srcMutator);
  // }

  // function boardContextFor(dropResult: DropResult, id: string) {
  //   if (dropResult.type === "LANE") {
  //     return views.has(id) && boardContext(views.get(id));
  //   }
  //   for (const [vid, view] of views) {
  //     const index = view.dataBridge.data.lanes.findIndex(
  //       (lane) => lane.id === id
  //     );
  //     if (index >= 0) return boardContext(view, index);
  //   }
  // }

  // function boardContext(view: KanbanView, laneIndex?: number) {
  //   return {
  //     view,
  //     laneIndex,
  //     file: view.file,
  //     mutate(mutator: helpers.BoardMutator, preview = false) {
  //       const bridge = view.dataBridge;
  //       const board = mutator(bridge.getData());
  //       // Save the change unless we're previewing
  //       if (!preview) bridge.setInternal(board);
  //       // And always Update the display
  //       bridge.setExternal(board);
  //     },
  //     getData(): Board {
  //       return view.dataBridge.getData();
  //     },
  //   };
  // }
}
