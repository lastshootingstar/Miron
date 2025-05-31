from futurehouse_client import FutureHouseClient, JobNames
from futurehouse_client.models.app import TaskRequest

API_KEY = "47dZJjMSffSD+UV8M2Ob+g.platformv01.eyJqdGkiOiJlYWRlY2RmMy0wOWU4LTQyZDMtYWFlNC1kMGIwMWY1NzUwYmUiLCJzdWIiOiI3S1hqNjl5VlNoVjRobFZnbFRGbloxY255R2kxIiwiaWF0IjoxNzQ4NjIxNTUwLCJleHAiOjE3NTEyMTM1NTB9.BdXfLJZm40N5FDA5U3IlNTBJOiamf5eGMP+YhQ4LwcA"  # Replace with your actual API key

def main():
    try:
        print("🔍 Connecting to FutureHouse API...")
        client = FutureHouseClient(api_key=API_KEY)

        query = "AI for early diagnosis of Alzheimer's disease"
        print(f"🔬 Running Crow Search for: {query}")

        task_request = TaskRequest(
            name=JobNames.CROW,
            query=query
        )

        responses = client.run_tasks_until_done(task_request)

        # Process each response object in the list
        for response in responses:
            print("\n✅ Search Answer:\n")
            print(response.formatted_answer or response.answer or "No answer available.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
