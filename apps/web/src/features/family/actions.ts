'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/server';
import { getFamilyServerApi } from './api/server';
import type { CreateTaskInput, FamilyTask, TaskStatus, UpdateTaskInput } from './types';

const FAMILY_PATH = '/family';

async function getAuthorizedFamilyApi() {
    await requireUser();
    return getFamilyServerApi();
}

function revalidateFamily() {
    revalidatePath(FAMILY_PATH);
}

export async function createFamilyTaskAction(input: CreateTaskInput): Promise<FamilyTask> {
    const familyApi = await getAuthorizedFamilyApi();
    const task = await familyApi.createTask(input);
    revalidateFamily();

    return task;
}

export async function updateFamilyTaskAction(input: {
    id: string;
    updates: UpdateTaskInput;
}): Promise<FamilyTask> {
    const familyApi = await getAuthorizedFamilyApi();
    const task = await familyApi.updateTask(input.id, input.updates);
    revalidateFamily();

    return task;
}

export async function advanceFamilyTaskStatusAction(input: {
    id: string;
    currentStatus: TaskStatus;
}): Promise<FamilyTask> {
    const familyApi = await getAuthorizedFamilyApi();
    const task = await familyApi.advanceStatus(input.id, input.currentStatus);
    revalidateFamily();

    return task;
}

export async function deleteFamilyTaskAction(id: string): Promise<void> {
    const familyApi = await getAuthorizedFamilyApi();
    await familyApi.deleteTask(id);
    revalidateFamily();
}
