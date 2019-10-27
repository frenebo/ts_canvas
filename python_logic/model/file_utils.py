import os
import sys
import pickle

SAVE_FILE_DIR = "save_files"
SAVE_EXTENSION = ".pickle"

def list_of_saved():
    os.makedirs(SAVE_FILE_DIR, exist_ok=True)

    file_names = os.listdir(SAVE_FILE_DIR)

    # remove file extensions
    save_names = ['.'.join(file_name.split('.')[:-1]) for file_name in file_names]

    return save_names

def save_model(save_file_name, model):
    os.makedirs(SAVE_FILE_DIR, exist_ok=True)
    save_file_path = os.path.join(SAVE_FILE_DIR, save_file_name)

    with open(save_file_path + SAVE_EXTENSION, "wb") as handle:
        pickle.dump(model, handle, protocol=pickle.HIGHEST_PROTOCOL)

def load_model(load_file_name):
    load_file_path = os.path.join(SAVE_FILE_DIR, load_file_name + SAVE_EXTENSION)

    if not os.path.exists(load_file_path):
        return None

    with open(load_file_path, "rb") as handle:
        model = pickle.load(handle)

    return model

def try_delete_file(file_name):
    file_path = os.path.join(SAVE_FILE_DIR, file_name + SAVE_EXTENSION)

    if os.path.exists(file_path):
        os.remove(file_path)
