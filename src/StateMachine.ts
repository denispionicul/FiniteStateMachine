import { RunService } from "@rbxts/services";

import Signal from "@rbxutil/signal";
import State, { StateConstructor } from "./State";
import Transition from "./Transition";

const ActiveStateMachines: StateMachine[] = [];

let HeartbeatConnection: RBXScriptConnection | undefined;

export default class StateMachine<Data = unknown> {
	private CurrentState: State;
	private StateMap = new Map<string, State>();
	private StateArray = new Array<State<Data>>();
	private PreviousState: State;

	/**
	 * Fires when the state is changed. The first argument is the new state while the second is the previous.
	 */
	public StateChanged = new Signal<[State, State]>();

	/**
		* Manually calls OnHeartbeat on EVERY state machine
		@param [OnlyManualStateMachines=false] If true, will call OnHeartbeat ONLY on state machines that have MustCallHeartbeatManually true.
	*/
	public static ExecuteHeartbeatEvents(DeltaTime: number, OnlyManualStateMachines: boolean = false) {
		for (const StateMachine of ActiveStateMachines) {
			if (OnlyManualStateMachines && !StateMachine.MustCallHeartbeatManually) continue;
			StateMachine.ExecuteHeartbeatEvent(DeltaTime);
		}
	}

	/**
	 *
	 * @param InitialState The initial state that the state machine will enter. Accepts the state name or constructor.
	 * @param States An array of states that the state machine will be able to access and switch to.
	 * @param MustCallHeartbeatManually If true, the OnHeartbeat method in every state will have to be called manually with the {@link StateMachine#ExecuteHeartbeatEvent} method.
	 * @param Data Can be anything you wish. This data will be visible by all states and transitions. Usually an object.
	 */
	constructor(
		InitialState: string | StateConstructor,
		States: StateConstructor[],
		public MustCallHeartbeatManually = false,
		public Data: Data = {} as Data,
	) {
		const StateName = tostring(InitialState);
		const CurrentState = States.find((State) => tostring(State) === StateName);

		assert(CurrentState, "Initial state provided isn't valid.");

		for (const State of States) {
			const StateObject = new State(this);

			task.spawn(() => StateObject.OnInit(StateObject.Data));

			if (StateObject.Transitions)
				for (const Transition of StateObject.Transitions) {
					const TransitionObject = new Transition(StateObject);

					TransitionObject.OnInit(TransitionObject.Data);
					StateObject.ActiveTransitions.push(TransitionObject as Transition);
				}

			this.StateMap.set(tostring(State), StateObject);
		}

		const TargetState = this.StateMap.get(StateName)!;
		this.PreviousState = TargetState; // not sure if this is the best approach
		this.CurrentState = TargetState;
		this.ChangeState(TargetState);

		ActiveStateMachines.push(this);

		if (HeartbeatConnection === undefined && !MustCallHeartbeatManually)
			HeartbeatConnection = RunService.Heartbeat.Connect((Delta) => {
				StateMachine.ExecuteHeartbeatEvents(Delta, true);
			});
	}

	/**
	 * Executes the OnHeartbeat method of the current state and transitions.
	 */
	public ExecuteHeartbeatEvent(DeltaTime: number) {
		task.spawn(() => (this.GetCurrentState() as State<Data>).OnHeartbeat(this.Data, DeltaTime));

		for (const Transition of this.CurrentState.ActiveTransitions)
			if (Transition.OnHeartbeat(this.Data, DeltaTime)) this.ChangeState(Transition.TargetState);
	}

	public GetCurrentState() {
		return this.CurrentState;
	}

	public GetPreviousState() {
		return this.PreviousState;
	}

	public GetStates() {
		return this.StateArray;
	}

	public ChangeState(State: string | State | StateConstructor) {
		const ChangingState = typeIs(State, "string") ? this.StateMap.get(State) : this.StateMap.get(tostring(State));

		assert(
			ChangingState,
			`Tried to change state from ${tostring(this.CurrentState)} to ${tostring(State)}. But it wasn't valid.`,
		);

		if (!this.CurrentState.CanChangeState(ChangingState)) return;

		const OldState = this.CurrentState;
		this.CurrentState = ChangingState;
		this.PreviousState = OldState;

		task.spawn(() => OldState.OnLeave(OldState.Data));
		for (const Transition of OldState.ActiveTransitions) task.spawn(() => Transition.OnLeave(Transition.Data));

		task.spawn(() => ChangingState.OnEnter(ChangingState.Data));
		for (const Transition of ChangingState.ActiveTransitions) task.spawn(() => Transition.OnEnter(Transition.Data));

		this.StateChanged.Fire(this.CurrentState, OldState);
	}

	public Destroy() {
		ActiveStateMachines.remove(ActiveStateMachines.indexOf(this as StateMachine));

		if (ActiveStateMachines.size() === 0) {
			HeartbeatConnection?.Disconnect();
			HeartbeatConnection = undefined;
		}

		for (const State of this.StateArray) {
			task.spawn(() => State.OnDestroy(this.Data));

			for (const Transition of State.ActiveTransitions) task.spawn(() => Transition.OnDestroy(Transition.Data));
			State.ActiveTransitions.clear();
		}
		this.StateArray.clear();
		this.StateMap.clear();
		this.StateChanged.Destroy();
	}
}
