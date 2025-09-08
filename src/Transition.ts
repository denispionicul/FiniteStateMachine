import State, { StateConstructor } from "./State";

export type TransitionConstructor = new (...args: [State: State]) => Transition;

export default abstract class Transition<T = unknown | undefined> {
	public Data: T;

	constructor(private State: State) {
		this.Data = State.Data as T;
	}

	public ChangeState(State: string | StateConstructor | State) {
		this.State.ChangeState(State as StateConstructor); // save me
	}

  public GetCurrentState() {
    return this.State.GetCurrentState();
  }

  public GetPreviousState() {
    return this.State.GetPreviousState();
  }

	// Meant to be overriden

    /**
     * Called when the state machine is constructed.
     */
    public OnInit(Data: T) {}

    /**
     * Called when the state machine switches to this state.
     */
    public OnEnter(Data: T) {}

    /**
     * Called when the state machine switches off this state.
     */
    public OnLeave(Data: T) {}

    /**
     * Called every heartbeat or when {@link StateMachine#ExecuteHeartbeatEvent} is called.
	 * @returns A boolean that represents whether the state machine will switch to this.TargetState
     */
    public OnHeartbeat(Data: T, DeltaTime: number): boolean {
		return false;
	}

    /**
     * Called when the state machine is destroyed.
     */
    public OnDestroy(Data: T) {}

	abstract TargetState: string | StateConstructor | State;
}
