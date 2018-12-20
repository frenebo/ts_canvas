using System.Collections.Generic;
using Newtonsoft.Json;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelChangeRequests {
  public static class Dispatcher {
    public static void dispatch(string str) {
      GenericReq genericReq = JsonConvert.DeserializeObject<GenericReq>(str);

      if (genericReq.type == "moveVertex") {
        MoveVertex.dispatch(str);
      } else if (genericReq.type == "cloneVertex") {
        CloneVertex.dispatch(str);
      } else if (genericReq.type == "createEdge") {
        CreateEdge.dispatch(str);
      } else if (genericReq.type == "deleteVertex") {
        DeleteEdge.dispatch(str);
      } else if (genericReq.type == "setLayerFields") {
        SetLayerFields.dispatch(str);
      }
    }
  }

  internal struct GenericReq {
    public string type;
  }

  internal struct MoveVertex {
    public static void dispatch(string str) {
      MoveVertex moveVertexReq = JsonConvert.DeserializeObject<MoveVertex>(str);
    }

    public string vertexId;
    public float x;
    public float y;
  }

  internal struct CloneVertex {
    public static void dispatch(string str) {
      CloneVertex cloneVertexReq = JsonConvert.DeserializeObject<CloneVertex>(str);
    }

    public string newVertexId;
    public string sourceVertexId;
    public float x;
    public float y;
  }

  internal struct CreateEdge {
    public static void dispatch(string str) {
      CreateEdge createEdgeReq = JsonConvert.DeserializeObject<CreateEdge>(str);
    }

    public string newEdgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  internal struct DeleteVertex {
    public static void dispatch(string str) {
      DeleteVertex deleteVertexReq = JsonConvert.DeserializeObject<DeleteVertex>(str);
    }

    public string vertexId;
  }

  internal struct DeleteEdge {
    public static void dispatch(string str) {
      DeleteEdge deleteEdgeReq = JsonConvert.DeserializeObject<DeleteEdge>(str);
    }

    public string edgeId;
  }

  internal struct SetLayerFields {
    public static void dispatch(string str) {
      SetLayerFields setLayerFieldsReq = JsonConvert.DeserializeObject<SetLayerFields>(str);
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }
}
#pragma warning restore 0649
