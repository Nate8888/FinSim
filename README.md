# FinSim
# Financial Simulator - Gamified Experience for Investment Learning

## Instructions

1. Clone the repository:
    ```sh
    git clone https://github.com/Nate8888/FinSim.git
    ```

### Windows

1. Open Command Prompt.
2. Navigate to the `backend` folder:
    ```sh
    cd FinSim/backend
    ```
3. Activate a virtual environment:
    ```sh
    python3 -m venv venv # command could be python or python3 
    .\venv\Scripts\activate     # On Windows
    ```
4. Install the dependencies
    ```sh
    python3 -m pip install -r requirements.txt # Make sure you are inside the backend folder
    ```
5. Run the Backend server
    ```sh
    python3 main.py
    ```
    ### MacOS

    1. Open Terminal.
    2. Navigate to the `backend` folder:
        ```sh
        cd FinSim/backend
        ```
    3. Activate the virtual environment:
        ```sh
        python3 -m venv venv # command could be python or python3 
        source venv/bin/activate
        ```
    4. Install the dependencies:
        ```sh
        python3 -m pip install -r requirements.txt
        ```
    5. Run the Backend server:
        ```sh
        python3 main.py
        ```
    ```

## Committing Code Changes

1. Pull the latest changes from the main branch:
    ```sh
    git pull origin main
    ```
2. Checkout to a new branch based on the main branch:
    ```sh
    git checkout -b your-branch-name
    ```
3. Add your changes:
    ```sh
    git add .
    ```
4. Commit your changes:
    ```sh
    git commit -m "Your commit message"
    ```
5. Push your changes to the remote repository:
    ```sh
    git push origin your-branch-name
    ```
