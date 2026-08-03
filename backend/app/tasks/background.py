from collections.abc import Awaitable, Callable

from fastapi import BackgroundTasks

AsyncTask = Callable[[], Awaitable[None]]


def enqueue_task(background_tasks: BackgroundTasks, task: AsyncTask) -> None:
    background_tasks.add_task(task)
