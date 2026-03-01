export type A2UIComponentType = 'container' | 'text' | 'button' | 'stat-card' | 'input';

export interface A2UIComponent {
    id: string;
    type: A2UIComponentType;
    props?: Record<string, any>;
    children?: A2UIComponent[];
}

export interface A2UIPayload {
    version: string;
    components: A2UIComponent[];
}
