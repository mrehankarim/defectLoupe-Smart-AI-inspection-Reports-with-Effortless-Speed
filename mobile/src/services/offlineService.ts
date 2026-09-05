import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./api";

export interface QueuedAction {
  id: string;
  type: "CREATE_AREA" | "ADD_TEXT_NOTE" | "UPDATE_STATUS";
  payload: any;
  timestamp: number;
}

export const offlineService = {
  async getQueue(): Promise<QueuedAction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async queueAction(action: Omit<QueuedAction, "id" | "timestamp">): Promise<void> {
    const queue = await this.getQueue();
    const newAction: QueuedAction = {
      ...action,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    queue.push(newAction);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  },

  async syncQueue(executor: (action: QueuedAction) => Promise<boolean>): Promise<{
    synced: number;
    failed: number;
  }> {
    const queue = await this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    const remaining: QueuedAction[] = [];

    for (const action of queue) {
      try {
        const success = await executor(action);
        if (success) {
          synced++;
        } else {
          remaining.push(action);
        }
      } catch {
        remaining.push(action);
      }
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_QUEUE,
      JSON.stringify(remaining)
    );
    return { synced, failed: remaining.length };
  },
};
