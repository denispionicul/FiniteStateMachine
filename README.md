(package will be released once I test this more)
# RobloxStateMachine

A simple finite state machine library very much inspired by [prooheckcp's RobloxStateMachine](https://github.com/prooheckcp/RobloxStateMachine). 

Was mainly done because I wanted to port RobloxStateMachine to RobloxTS.

## StateMachine

### `constructor(InitialState, States, MustCallHeartbeatManually, Data)`

#### Parameters

- InitialState - The initial state that the state machine will enter. Accepts the state name or constructor.
- States - An array of states that the state machine will be able to access and switch to.
- MustCallHeartbeatManually - If true, the OnHeartbeat method in every state will have to be called manually with the StateMachine.ExecuteHeartbeatEvent method.
- Data - Can be anything you wish. This data will be visible by all states and transitions. Usually an object.

```ts
import { StateMachine, State, StateConstructor } from "@rbxts/finite-state-machine";

function RequireStates(Path: Folder) {
    return Path.GetChildren().map(Child => require(Child as ModuleScript) as StateConstructor);
}

const NPC = {
    Instance: Workspace.NPC,

    Health: 100,
}

const Machine = new StateMachine(
    "Roaming",
    RequireStates(ReplicatedStorage.States),
    false,
    NPC
);
```

### `ChangeState(State)`
Used to change the state of the machine.

#### Parameters
- State - Can be either a string, a constructor or one of the states you get by calling `StateMachine.GetStates()`

### `GetCurrentState()`

#### Returns
- State - The `State` that is currently on.


### `GetPreviousState()`

#### Returns
- State - The previous `State` that used to be on.


### `GetStates()`

#### Returns
- States - An array of states that the state machine has.


### `ExecuteHeartbeatEvent(Delta)`
A method that when called, calls the OnHeartbeat method of both the current state and the current state's transitions.

#### Parameters
- Delta - The delta time of the heartbeat event.


### `Destroy()`
Stops the machine from running.


### `StateChanged`
An event that fires whenever the state machine changes states
```ts
StateMachine.StateChanged.Connect((NewState, OldState) => {
    // ...
})
```

### `StateMachine.ExecuteHeartbeatEvents(Delta, OnlyManualStateMachines)`
A **Static** method that can be called to execute the OnHeartbeat methods on ALL the active StateMachines.
Useful for when you want to call the OnHeartbeat events at different times/with different DeltaTime or use some other event like RenderStepped.

#### Parameters

- Delta - The delta time

- OnlyManualStateMachines - If true, will call the OnHeartbeat events only on State Machines that have MustCallHeartbeatManually to true. Otherwise only the ones who have it to false.


## Creating States

Let's say we have a state named Roaming.
```ts
import { State } from "@rbxts/roblox-state-machine";
import { NPCType } from "./Types";

// The Data parameter is the 4th parameter of the state machine constructor, and the type of data can be specified in the State<Data> type.
export = class Roaming extends State<NPCType> {
    // The transitions that this state will use. Is optional.
    // Documentation about transitions is further below.
    Transitions = []

    OnEnter(Data: NPCType) {
        // This is called when the state machine switches to this state.

        // Data can also be accessed with this.Data
    }

    OnLeave(Data: NPCType) {
        // Called when the state machine leaves this state
    }

    OnInit(Data: NPCType) {
        // Called when the state machine is constructed.
    }

    OnHeartbeat(Data: NPCType, Delta: number) {
        // Called every heartbeat or when StateMachine.ExecuteHeartbeatEvent is called while this state is currently on.

        if (Data.Anger > 100) this.ChangeState("Angry");
    }

    OnDestroy(Data: NPCType) {
        // Called when the state machine is destroyed.
    }

    // A method that is called everytime the state machine tries to change states. If it returns false, the state machine won't change the current state.
    CanChangeState(Target: State<NPCType>) {
        // In this scenario, if the machine wants to switch to the Running state while it's in the Roaming state (this state), don't allow it to switch.
        return Target.Name !== "Running"
    }
}
```
And now we can create a state machine that uses this state.
```ts
import { StateMachine } from "@rbxts/roblox-state-machine";
import Roaming from "somewhere";

const NPC = ...

const Machine = new StateMachine("Roaming", [Roaming], false, NPC);
```
Do note that the machine starts immediately after it's constructed.

## Transitions
Transitions can help with transitioning states. They serve as a little bonus on top of states.

Again, let's say we have a file named RunningTransition.
```ts
import { Transition } from "@rbxts/roblox-state-machine";
import { NPCType } from "./Types";

export = class RunningTransition extends Transition<NPCType> {
    // The target state that the transition will make the state machine transition to. Can be either a string, a State from StateMachine.GetStates() or a state constructor. See the OnHeartbeat method here.
    TargetState = "Running";

    OnEnter(Data: NPCType) {
        // This is called when the state machine switches to the state that uses this transition.

        // Data can also be accessed with this.Data
    }

    OnLeave(Data: NPCType) {
        // Called when the state machine leaves the state that uses this transition.
    }

    OnInit(Data: NPCType) {
        // Called when the state machine is constructed.
    }

    OnHeartbeat(Data: NPCType, Delta: number): boolean {
        // Called every heartbeat or when StateMachine.ExecuteHeartbeatEvent is called while the state that uses this transition is currently on. If this method returns true, the state machine will switch to the TargetState

        // In this case, if the npc anger is over 100, we will transition to the running state (Because the TargetState is set to Running).
        return Data.Anger > 100
    }

    OnDestroy(Data: NPCType) {
        // Called when the state machine is destroyed.
    }
}
```
We can apply this transition to a state like so:
```ts
import RunningTransition from "somewhere";

// RunningTransition can be used for other states, too.
class Roaming extends State<NPCType> {
    Transitions = [RunningTransition]
}
```

## Final notes
States and transitions can inherit from other states/transitions.
States and Transitions have most of the methods that `StateMachine` has.