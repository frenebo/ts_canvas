using System.Collections.Generic;

namespace VersionedModelClassNS {
    public class VersionedModelClass {
        private List<ModelClassNS.ModelClass> prevModelContainers = new List<ModelClassNS.ModelClass>();
        private List<ModelClassNS.ModelClass> futureModelContainers = new List<ModelClassNS.ModelClass>();
        private ModelClassNS.ModelClass currentModelContainer = new ModelClassNS.ModelClass();

        public void snapshot() {
            this.prevModelContainers.Add(this.currentModelContainer.clone());
            
            this.futureModelContainers.Clear();
        }

        public ModelClassNS.ModelClass getCurrent() {
            return this.currentModelContainer;
        }

        public void tryRedo() {
            if (this.futureModelContainers.Count != 0) {
                this.prevModelContainers.Add(this.currentModelContainer);
                this.currentModelContainer = this.futureModelContainers[0];
                this.futureModelContainers.RemoveAt(0);
            }
        }

        public void tryUndo() {
            if (this.prevModelContainers.Count != 0) {
                this.futureModelContainers.Insert(0, this.currentModelContainer);
                this.currentModelContainer = this.prevModelContainers[this.prevModelContainers.Count - 1];
                this.prevModelContainers.RemoveAt(this.prevModelContainers.Count - 1);
            }
        }
    }
}