import StateMachine from "./StateMachine";
import Transition, { TransitionConstructor } from "./Transition";

export type StateConstructor = new (...args: [StateMachine: StateMachine]) => State

export default abstract class State<T = unknown> {
    public Data;

    public Transitions?: TransitionConstructor[];

    public ActiveTransitions: Transition<T>[] = [];

    constructor (private StateMachine: StateMachine) {
        this.Data = StateMachine.Data as T;
    }

    public ChangeState(State: string | State | StateConstructor) {
        this.StateMachine.ChangeState(State as StateConstructor); // I'm sorry
    }

    public GetCurrentState() {
        return this.StateMachine.GetCurrentState();
    }

    // Methods meant to be overriden

    /**
     * A method that controls whether the state machine is allowed to switch off this state.
     * @param Target The state that the state machine wants to switch to.
     * @returns A boolean that when true, will allow the state to be changed
     */
    public CanChangeState(Target: State<T>) {
        return true;
    }

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
     */
    public OnHeartbeat(Data: T, DeltaTime: number) {}

    /**
     * Called when the state machine is destroyed.
     */
    public OnDestroy(Data: T) {}
}