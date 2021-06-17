import update from "immutability-helper";
import React from "react";
import { Lane } from "../types";
import { c } from "../helpers";
import { GripIcon } from "../Icon/GripIcon";
import { Icon } from "../Icon/Icon";
import { ObsidianContext } from "../context";
import { LaneTitle } from "./LaneTitle";
import { LaneSettings } from "./LaneSettings";
import { useSettingsMenu, ConfirmAction } from "./LaneMenu";
import { t } from "src/lang/helpers";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface LaneHeaderProps {
  lane: Lane;
  laneIndex: number;
  dragHandleProps?: SyntheticListenerMap;
}

export const LaneHeader = React.memo(
  ({ lane, laneIndex, dragHandleProps }: LaneHeaderProps) => {
    const { boardModifiers } = React.useContext(ObsidianContext);
    const [isEditing, setIsEditing] = React.useState(false);

    const { settingsMenu, confirmAction, setConfirmAction } = useSettingsMenu({
      setIsEditing,
    });

    return (
      <>
        <div
          onDoubleClick={() => setIsEditing(true)}
          className={c("lane-header-wrapper")}
        >
          <div
            className={c("lane-grip")}
            {...dragHandleProps}
          >
            <GripIcon />
          </div>

          <LaneTitle
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            itemCount={lane.items.length}
            title={lane.title}
            onChange={(e) =>
              boardModifiers.updateLane(
                laneIndex,
                update(lane, { title: { $set: e.target.value } })
              )
            }
          />

          <div className={c("lane-settings-button-wrapper")}>
            {isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(false);
                }}
                aria-label="Close"
                className={`${c("lane-settings-button")} is-enabled`}
              >
                <Icon name="cross" />
              </button>
            ) : (
              <button
                aria-label={t("More options")}
                className={c("lane-settings-button")}
                onClick={(e) => {
                  settingsMenu.showAtPosition({ x: e.clientX, y: e.clientY });
                }}
              >
                <Icon name="vertical-three-dots" />
              </button>
            )}
          </div>
        </div>

        {isEditing && <LaneSettings lane={lane} laneIndex={laneIndex} />}

        {confirmAction && (
          <ConfirmAction
            lane={lane}
            action={confirmAction}
            onAction={() => {
              switch (confirmAction) {
                case "archive":
                  boardModifiers.archiveLane(laneIndex);
                  break;
                case "archive-items":
                  boardModifiers.archiveLaneItems(laneIndex);
                  break;
                case "delete":
                  boardModifiers.deleteLane(laneIndex);
                  break;
              }

              setConfirmAction(null);
            }}
            cancel={() => setConfirmAction(null)}
          />
        )}
      </>
    );
  }
);
