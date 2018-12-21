using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

// fields are assigned to from json
#pragma warning disable 0649
namespace ModelChangeRequests {
  public static class Dispatcher {
    public static void dispatch(JObject jobj) {
      GenericReq genericReq = jobj.ToObject<GenericReq>();

      if (genericReq.type == "moveVertex") {
        MoveVertex.dispatch(jobj);
      } else if (genericReq.type == "cloneVertex") {
        CloneVertex.dispatch(jobj);
      } else if (genericReq.type == "createEdge") {
        CreateEdge.dispatch(jobj);
      } else if (genericReq.type == "deleteVertex") {
        DeleteEdge.dispatch(jobj);
      } else if (genericReq.type == "setLayerFields") {
        SetLayerFields.dispatch(jobj);
      }
    }
  }

  internal struct GenericReq {
    public string type;
  }

  internal struct MoveVertex {
    public static void dispatch(JObject jobj) {
      MoveVertex moveVertexReq = jobj.ToObject<MoveVertex>();
    }

    public string vertexId;
    public float x;
    public float y;
  }

  internal struct CloneVertex {
    public static void dispatch(JObject jobj) {
      CloneVertex cloneVertexReq = jobj.ToObject<CloneVertex>();
    }

    public string newVertexId;
    public string sourceVertexId;
    public float x;
    public float y;
  }

  internal struct CreateEdge {
    public static void dispatch(JObject jobj) {
      CreateEdge createEdgeReq = jobj.ToObject<CreateEdge>();
    }

    public string newEdgeId;
    public string sourceVertexId;
    public string sourcePortId;
    public string targetVertexId;
    public string targetPortId;
  }

  internal struct DeleteVertex {
    public static void dispatch(JObject jobj) {
      DeleteVertex deleteVertexReq = jobj.ToObject<DeleteVertex>();
    }

    public string vertexId;
  }

  internal struct DeleteEdge {
    public static void dispatch(JObject jobj) {
      DeleteEdge deleteEdgeReq = jobj.ToObject<DeleteEdge>();
    }

    public string edgeId;
  }

  internal struct SetLayerFields {
    public static void dispatch(JObject jobj) {
      SetLayerFields setLayerFieldsReq = jobj.ToObject<SetLayerFields>();
    }

    public string layerId;
    public Dictionary<string, string> fieldValues;
  }
}
#pragma warning restore 0649
