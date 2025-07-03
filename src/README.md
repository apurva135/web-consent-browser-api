# Extension Setup Instructions

Follow these instructions to set up and run the extension on your local machine.

## Prerequisites
- Python 3.x installed
- Command Prompt or Terminal access
- A modern web browser such as Chrome or Firefox

## Installation Steps

### 1. Unzip the File
Unzip the file you received via email to a directory of your choice.

### 2. Open the Command Prompt
Navigate to the unzipped folder:
```bash
cd path_to_unzipped_folder/server
```

### 3. Create a Virtual Environment (Optional but Recommended)
python -m venv venv
On Windows
venv\Scripts\activate
On Unix or MacOS
source venv/bin/activate

### 4.Install Dependencies
pip install -r requirements.txt

### 5.Run the Server Script
python app.py
Ensure that the server is running on localhost:5000

### 6. Open Your Browser and Go to the Extensions Tab
Toggle the Developer Mode switch at the top right corner.
Click on "Load unpacked" and select the unzipped extension folder(make sure the folder contains manifest.json file, which is the exact and correct path).

### 7. Load the Unpacked Extension
Click on "Load unpacked" and select the unzipped extension folder(make sure the folder contains manifest.json file, which is the exact and correct path).

### 8. Activate the Extension
Once the extension is loaded, it should appear in your extensions list. Activate it and adjust any settings necessary for managing consent popups.

### 9. Monitor Consents
Regularly check the extension's dashboard or the corresponding section to view and manage accepted consents.
