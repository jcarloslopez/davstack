import { act, fireEvent, render, waitFor } from '@testing-library/react';

import { describe, expect, expectTypeOf, test } from 'vitest';
import { store } from '../src';

// Define testIds only once, avoiding repetition
const testIds = {
	count: 'count',
	doubledCount: 'doubled-count',
	increment: 'increment',
	decrement: 'decrement',
	componentUsingGetRenderCount: 'component-using-get-render-count',
	componentUsingUseRenderCount: 'component-using-use-render-count',
};

// Simpler UI retrieval without redundant getByTestId spread
const getUi = ({ getByTestId, ...rest }: ReturnType<typeof render>) => {
	return {
		getByTestId,
		...rest,
		get count() {
			return getByTestId(testIds.count).textContent;
		},
		get doubledCount() {
			return getByTestId(testIds.doubledCount).textContent;
		},
		getCount: () => getByTestId(testIds.count).textContent,
		getDoubledCount: () => getByTestId(testIds.doubledCount).textContent,
		fireIncrement: () => fireEvent.click(getByTestId(testIds.increment)),
		fireDecrement: () => fireEvent.click(getByTestId(testIds.decrement)),
		get componentUsingGetRenderCount() {
			return getByTestId(testIds.componentUsingGetRenderCount).textContent;
		},
		get componentUsingUseRenderCount() {
			return getByTestId(testIds.componentUsingUseRenderCount).textContent;
		},
	};
};

describe('store with computed properties', () => {
	describe('basic example', () => {
		const countStore = store({
			count: 10,
		})
			.computed((store) => ({
				doubled: () => store.count.use() * 2,
			}))
			.actions((store) => ({
				increment() {
					store.count.set(store.count.get() + 1);
				},
				decrement() {
					store.count.set(store.count.get() - 1);
				},
			}));

		test('initial computed property value', () => {
			expect(countStore.count.get()).toBe(10);
			expect(countStore.doubled.get()).toBe(20);
		});

		test('computed property updates on state change', () => {
			const count = countStore.count.get();

			const doubled = countStore.doubled.get();
			expect(count).toBe(10);
			expect(doubled).toBe(20);
		});
		test('computed property updates on action state changes', () => {
			const count = countStore.count.get();

			const doubled = countStore.doubled.get();
			expect(count).toBe(10);
			expect(doubled).toBe(20);

			countStore.increment();
			expect(countStore.count.get()).toBe(11);

			expect(countStore.doubled.get()).toBe(22);

			countStore.decrement();
			expect(countStore.count.get()).toBe(10);

			expect(countStore.doubled.get()).toBe(20);
		});

		test('should be read only', () => {
			expectTypeOf(countStore.doubled).not.toHaveProperty('set');
			expectTypeOf(countStore.doubled).not.toHaveProperty('assign');

			expectTypeOf(countStore.doubled).toHaveProperty('use');

			expectTypeOf(countStore.doubled).toHaveProperty('get');
		});
	});
	describe('nested example', () => {
		const countStore = store({
			parent: { count: 10 },
		})
			.computed((store) => ({
				doubled: () => store.parent.count.get() * 2,
			}))
			.extend((store) => ({
				increment() {
					store.parent.count.set(store.parent.count.get() + 1);
				},
				decrement() {
					store.parent.count.set(store.parent.count.get() - 1);
				},
			}));

		test('initial computed property value', () => {
			expect(countStore.parent.count.get()).toBe(10);
			expect(countStore.doubled.get()).toBe(20);
		});

		test('computed property updates on state change', () => {
			const count = countStore.parent.count.get();

			const doubled = countStore.doubled.get();
			expect(count).toBe(10);
			expect(doubled).toBe(20);
		});
		test('computed property updates on action state changes', () => {
			const count = countStore.parent.count.get();

			const doubled = countStore.doubled.get();
			expect(count).toBe(10);
			expect(doubled).toBe(20);

			countStore.increment();
			expect(countStore.parent.count.get()).toBe(11);

			expect(countStore.doubled.get()).toBe(22);

			countStore.decrement();
			expect(countStore.parent.count.get()).toBe(10);

			expect(countStore.doubled.get()).toBe(20);
		});

		test('should be read only', () => {
			expectTypeOf(countStore.doubled).not.toHaveProperty('set');
			expectTypeOf(countStore.doubled).not.toHaveProperty('assign');

			expectTypeOf(countStore.doubled).toHaveProperty('use');

			expectTypeOf(countStore.doubled).toHaveProperty('get');
		});
	});

	describe('computed properties', () => {
		// Define a store with an initial count state and a computed property for the doubled count
		const countStore = store()
			.state({ count: 0 })
			.computed((store) => ({
				doubled: () => store.count.use() * 2,
			}))
			.extend((store) => ({
				useDoubled() {
					return store.count.use() * 2;
				},
				increment() {
					store.count.set(store.count.get() + 1);
				},
				decrement() {
					store.count.set(store.count.get() - 1);
				},
			}));

		const Counter = () => {
			const count = countStore.doubled.use();

			return (
				<div>
					<p data-testid={testIds.count}>Count: {count}</p>

					<button
						data-testid={testIds.increment}
						onClick={countStore.increment}
					>
						Increment
					</button>
					<button
						data-testid={testIds.decrement}
						onClick={countStore.decrement}
					>
						Decrement
					</button>
				</div>
			);
		};
		const Doubled = () => {
			const doubled = countStore.doubled.get();
			// const doubled = countStore.useDoubled();
			return (
				<div>
					<p data-testid={testIds.doubledCount}>Doubled: {doubled}</p>
				</div>
			);
		};

		function Counters() {
			return (
				<div>
					<Counter />
					<Doubled />
				</div>
			);
		}

		test('computed property updates on state change', () => {
			const ui = getUi(render(<Counters />));

			expect(ui.count).toBe('Count: 0');
			expect(ui.doubledCount).toBe('Doubled: 0');
			// const ui = getUi(render(<Counters />));

			// console.log(ui.debug());

			act(() => {
				ui.fireIncrement();
			});

			waitFor(() => {
				expect(ui.count).toBe('Count: 1');
				expect(ui.doubledCount).toBe('Doubled: 2');
			});

			act(() => {
				ui.fireDecrement();
			});
			waitFor(() => {
				expect(ui.count).toBe('Count: 0');
				expect(ui.doubledCount).toBe('Doubled: 0');
			});
		});
	});
	describe('computed properties', () => {
		// Define a store with an initial count state and a computed property for the doubled count
		const countStore = store(0)
			.computed((state) => ({
				doubled: () => state.use() * 2,
			}))
			.extend((store) => ({
				increment() {
					store.set(store.get() + 1);
				},
				decrement() {
					store.set(store.get() - 1);
				},
			}));

		const Counter = () => {
			const count = countStore.use();

			return (
				<div>
					<p data-testid={testIds.count}>Count: {count}</p>

					<button
						data-testid={testIds.increment}
						onClick={countStore.increment}
					>
						Increment
					</button>
					<button
						data-testid={testIds.decrement}
						onClick={countStore.decrement}
					>
						Decrement
					</button>
				</div>
			);
		};
		const Doubled = () => {
			const doubled = countStore.doubled.use();
			return (
				<div>
					<p data-testid={testIds.doubledCount}>Doubled: {doubled}</p>
				</div>
			);
		};

		function Counters() {
			return (
				<>
					<Counter />
					<Doubled />
				</>
			);
		}

		test('initial computed property value', () => {
			const ui = getUi(render(<Counters />));
			expect(ui.count).toBe('Count: 0');
			expect(ui.doubledCount).toBe('Doubled: 0');
		});

		test('computed property updates on state change', () => {
			const ui = getUi(render(<Counters />));

			expect(ui.count).toBe('Count: 0');
			expect(ui.doubledCount).toBe('Doubled: 0');

			act(() => {
				ui.fireIncrement();
			});
			expect(ui.count).toBe('Count: 1');
			expect(ui.doubledCount).toBe('Doubled: 2');

			act(() => {
				ui.fireDecrement();
			});
			expect(ui.count).toBe('Count: 0');
			expect(ui.doubledCount).toBe('Doubled: 0');
		});
	});
});
