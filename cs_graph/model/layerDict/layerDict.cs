using System.Collections.Generic;

namespace LayerContainers {
  public struct LayerDict {
    public Dictionary<string, Layers.Layer> layers;

    public LayerDict clone() {
      var clonedLayers = new Dictionary<string, Layers.Layer>();

      foreach (KeyValuePair<string, Layers.Layer> entry in this.layers) {
        clonedLayers[entry.Key] = entry.Value.clone();
      }

      return new LayerDict {
        layers = clonedLayers
      };
    }
  }
}
