using System.Collections.Generic;

namespace PlaceholderFileSystemNS {
    // @TODO: Save models permanently somehow?
    public class PlaceHolderFileSystem {
        private Dictionary<string, ModelClassNS.ModelClass> saved = new Dictionary<string, ModelClassNS.ModelClass>();

        public void saveModel(string name, ModelClassNS.ModelClass model) {
            this.saved[name] = model.clone();
        }

        public List<string> getSavedNames() {
            return new List<string>(this.saved.Keys);
        }

        public bool containsModelName(string name) {
            return this.saved.ContainsKey(name);
        }

        public ModelClassNS.ModelClass loadModel(string name) {
            return this.saved[name].clone();
        }

        public void deleteFileName(string name) {
            this.saved.Remove(name);
        }
    }
}