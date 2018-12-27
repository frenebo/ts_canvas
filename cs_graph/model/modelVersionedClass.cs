using System.Collections.Generic;

namespace VersionedModelClassNS {
    public class VersionedModelClass {
        private int? savePosition = null;
        private string currentFileName = null; // redundant null?
        private PlaceholderFileSystemNS.PlaceHolderFileSystem placeholderFS = new PlaceholderFileSystemNS.PlaceHolderFileSystem();
        private List<ModelClassNS.ModelClass> prevModelContainers = new List<ModelClassNS.ModelClass>();
        
        // @NOTE: future model containers start at 0 for closest to current, versions furthest in the "future" are at the end of the list.
        // It could also be other way around
        private List<ModelClassNS.ModelClass> futureModelContainers = new List<ModelClassNS.ModelClass>();
        private ModelClassNS.ModelClass currentModelContainer;

        public VersionedModelClass() {
            this.currentModelContainer = new ModelClassNS.ModelClass();
        }

        public VersionedModelClass(ModelClassNS.ModelClass modelClass) {
            this.currentModelContainer = modelClass;
        }

        public void recordModel() {
            this.prevModelContainers.Add(this.currentModelContainer.clone());
            
            this.futureModelContainers.Clear();

            if (this.savePosition.HasValue) {
                if (this.savePosition > 0) {
                    this.savePosition = null;
                } else {
                    this.savePosition--;
                }
            }
        }

        public ModelClassNS.ModelClass getCurrent() {
            return this.currentModelContainer;
        }

        public void tryRedo() {
            if (this.futureModelContainers.Count != 0) {
                this.prevModelContainers.Add(this.currentModelContainer);
                this.currentModelContainer = this.futureModelContainers[0];
                this.futureModelContainers.RemoveAt(0);

                if (this.savePosition.HasValue) {
                    this.savePosition--;
                }
            }
        }

        public void tryUndo() {
            if (this.prevModelContainers.Count != 0) {
                this.futureModelContainers.Insert(0, this.currentModelContainer);
                this.currentModelContainer = this.prevModelContainers[this.prevModelContainers.Count - 1];
                this.prevModelContainers.RemoveAt(this.prevModelContainers.Count - 1);

                if (this.savePosition.HasValue) {
                    this.savePosition++;
                }
            }
        }

        public void saveToFile(string fileName) {
            this.placeholderFS.saveModel(fileName, this.currentModelContainer);
            this.currentFileName = fileName;
            this.savePosition = 0;
        }

        public void unsafeOpen(string fileName) {
            this.currentModelContainer = this.placeholderFS.loadModel(fileName);
            this.prevModelContainers.Clear();
            this.futureModelContainers.Clear();
            this.currentFileName = fileName;
            this.savePosition = 0;
        }

        public bool isFileCurrentlyOpen() {
            return this.currentFileName != null;
        }

        public string unsafeGetCurrentFileName() {
            if (this.currentFileName == null) {
                throw new System.Exception("No file open"); // @TODO custom exception?
            }
            
            return this.currentFileName;
        }

        public bool progressIsSaved() {
            return this.savePosition.HasValue && this.savePosition == 0;
        }

        public void unsafeDelete(string fileName) {
            this.placeholderFS.deleteFileName(fileName);
            if (this.currentFileName == fileName) {
                this.currentFileName = null;
                this.savePosition = null;
            }
        }

        public bool fileExistsWithName(string fileName) {
            return this.placeholderFS.containsModelName(fileName);
        }

        public List<string> getSavedFileNames() {
            return this.placeholderFS.getSavedNames();
        }
    }
}