load('dom.js');
load('string.js');
load('array.js');
load('../nanosax.js/nanosax.js');
load('../dommer/dommer.js');
WARN_ON_PREFIX = false;

function setup() {
    this.doc = new dommer.Document();
};

function test_toXML() {
    var node = doc.createElementNS('foo:', 'foo');
    node.appendChild(doc.createElementNS('bar:', 'bar'));
    node.appendChild(doc.createTextNode('baz'));

    testing.assertEquals(domlib.toXML(node),
            '<foo xmlns="foo:"><bar xmlns="bar:" />baz</foo>');
};

function test_toXML_document() {
    var node = doc.createElementNS('foo:', 'foo');
    doc.documentElement = node;
    node.appendChild(doc.createElementNS('bar:', 'bar'));
    node.appendChild(doc.createTextNode('baz'));

    testing.assertEquals(domlib.toXML(doc),
            '<?xml version="1.0" ?>\n' +
            '<foo xmlns="foo:"><bar xmlns="bar:" />baz</foo>');
};

function test_toXML_text() {
    var node = doc.createElementNS('foo:', 'foo');
    var text = doc.createTextNode('baz & qux');
    node.appendChild(text);

    testing.assertEquals(domlib.toXML(text), 'baz &amp; qux');
};

function test_toXML_no_xmlns_repeat() {
    var node = doc.createElementNS('foo:', 'foo');
    node.appendChild(doc.createElementNS('foo:', 'bar'));

    testing.assertEquals(domlib.toXML(node),
            '<foo xmlns="foo:"><bar /></foo>');
};

function test_toXML_no_xmlns_prefix_repeat() {
    var node = doc.createElementNS('foo:', 'foo');
    node.setPrefix('foo');
    var barnode = doc.createElementNS('foo:', 'bar')
    barnode.setPrefix('foo');
    node.appendChild(barnode);

    testing.assertEquals(domlib.toXML(node),
            '<foo:foo xmlns:foo="foo:"><foo:bar /></foo:foo>');
};

function test_toXML_no_xmlns_xml_xmlns() {
    var node = doc.createElementNS('foo:', 'foo');
    node.setPrefix('foo');
    node._setProtected('namespaceURI', 'foo:');
    testing.assertEquals(domlib.toXML(node), '<foo:foo xmlns:foo="foo:" />');
};

function test_toXML_duplicate_prefix() {
    var node = doc.createElementNS('foo:', 'foo');
    node.setAttributeNS('bar:', 'bar', 'bar');
    testing.assertEquals(domlib.toXML(node),
                         '<foo ns0:bar="bar" xmlns="foo:" xmlns:ns0="bar:" />')
};

function test_toXML_unprefixed_attr_with_child() {
    var node = doc.createElementNS('foo:', 'foo');
    node.setPrefix('');
    var child = doc.createElementNS('foo:', 'bar');
    node.appendChild(child);
    child.setAttributeNS('foo:', 'baz', 'baz');
    testing.assertEquals(domlib.toXML(node),
        '<foo xmlns="foo:"><ns0:bar ns0:baz="baz" xmlns:ns0="foo:" /></foo>');
};

function test_toXML_unprefixed_attr_with_grandchild() {
    var node = doc.createElementNS('foo:', 'foo');
    node.setPrefix('');
    var child = doc.createElementNS('foo:', 'bar');
    node.appendChild(child);
    child.setAttributeNS('foo:', 'baz', 'baz');
    var child2 = doc.createElementNS('foo2:', 'quux');
    child.appendChild(child2);

    testing.assertEquals(domlib.toXML(node),
        '<foo xmlns="foo:"><ns0:bar ns0:baz="baz" xmlns:ns0="foo:">' +
        '<quux xmlns="foo2:" /></ns0:bar></foo>');
};

function test_toXML_prefixed_attr_default_node() {
    var node = doc.createElement('foo');
    node.setAttributeNS('bar:', 'bar', 'bar');
    testing.assertEquals(domlib.toXML(node),
                         '<foo ns0:bar="bar" xmlns:ns0="bar:" />');
};

function test_toXML_attr_same_ns() {
    var node = doc.createElementNS('foo:', 'foo');
    node.setAttributeNS('foo:', 'bar', 'baz');
    testing.assertEquals(domlib.toXML(node),
                         '<ns0:foo ns0:bar="baz" xmlns:ns0="foo:" />');
};

function test_toXML_attr_sans_ns() {
    var node = doc.createElementNS('foo:', 'foo');
    node.setAttribute('bar', 'baz');
    testing.assertEquals(node.attributes[0].namespaceURI, null);
    testing.assertEquals(domlib.toXML(node),
                         '<foo bar="baz" xmlns="foo:" />');
};

function test_toXML_xmlid() {
    var node = doc.createElement('foo');
    node.setAttribute('xml:id', 'foobar');
    testing.assertEquals(domlib.toXML(node), '<foo xml:id="foobar" />');
};

function test_toXML_xmlid_with_namespace() {
    var node = doc.createElement('foo');
    node.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:id',
                        'foobar');
    testing.assertEquals(domlib.toXML(node), '<foo xml:id="foobar" />');
};

function test_toXML_xmlid_nested() {
    // just to keep Jasper happy :)
    var node = doc.createElement('foo');
    var child = doc.createElement('bar');
    node.setAttribute('xml:id', 'foo');
    child.setAttribute('xml:id', 'bar');
    node.appendChild(child);

    testing.assertEquals(domlib.toXML(node),
                         '<foo xml:id="foo"><bar xml:id="bar" /></foo>');
};

function test_toXML_triple_nested() {
    // this borked in Cobes
    var node1 = doc.createElementNS('bar:', 'a');
    doc.appendChild(node1);
    var node2 = doc.createElementNS('foo:', 'b');
    node2.setPrefix('dbi');
    node1.appendChild(node2);
    var node3 = doc.createElementNS('bar:', 'c');
    node2.appendChild(node3);

    testing.assertEquals(domlib.toXML(node1),
                         '<a xmlns="bar:"><dbi:b xmlns:dbi="foo:">' +
                         '<c /></dbi:b></a>');
};

function test_hasClass() {
    var node = doc.createElement('foo');
    node.className = 'foo';
    testing.assertTrue(domlib.hasClass(node, 'foo'));
    testing.assertFalse(domlib.hasClass(node, 'fo'));
    testing.assertFalse(domlib.hasClass(node, 'oo'));

    node.className = 'foo bar';
    testing.assertTrue(domlib.hasClass(node, 'foo'));
    testing.assertTrue(domlib.hasClass(node, 'bar'));
    testing.assertFalse(domlib.hasClass(node, 'foo bar'));
};

function test_addClass() {
    var node = doc.createElement('foo');

    node.className = '';
    domlib.addClass(node, 'foo');
    testing.assertEquals(node.className, 'foo');
    domlib.addClass(node, 'bar');
    testing.assertEquals(node.className, 'foo bar');

    domlib.addClass(node, 'foo');
    testing.assertEquals(node.className, 'foo bar');
};

function test_removeClass() {
    var node = doc.createElement('foo');
    node.className = 'foo bar';

    domlib.removeClass(node, 'foo');
    testing.assertEquals(node.className, 'bar');
    domlib.removeClass(node, 'bar');
    testing.assertFalse(node.className);

    testing.assertThrows(undefined, domlib.removeClass, domlib, node, 'baz');
};

function test_toXML_nested_namespaces() {
    var node = doc.createElementNS('foo:', 'foo');
    var child = doc.createElementNS('bar:', 'bar');
    doc.documentElement = node;
    node.appendChild(child);

    testing.assertEquals(domlib.toXML(doc.documentElement),
                         '<foo xmlns="foo:"><bar xmlns="bar:" /></foo>');
};

function test_toXML_comment() {
    var root = doc.createElement('foo');
    doc.appendChild(root);
    root.appendChild(doc.createComment(' foo & bar '));
    testing.assertEquals(domlib.toXML(doc.documentElement),
                         '<foo><!-- foo & bar --></foo>');
};

function test_getElementsByClassName() {
    var root = doc.createElement('foo');
    var child = doc.createElement('bar');
    root.appendChild(child);
    doc.appendChild(root);

    testing.assertEquals(domlib.getElementsByClassName(root, 'foo'), []);

    root.className = 'foo';
    var result = domlib.getElementsByClassName(doc, 'foo');
    testing.assertEquals(result.length, 1);
    testing.assertEquals(result[0].nodeName, 'foo');

    child.className = 'foo';
    var result = domlib.getElementsByClassName(doc, 'foo');
    testing.assertEquals(result.length, 2);
    testing.assertEquals(result[1].nodeName, 'bar');

    child.className = 'foo bar';
    var result = domlib.getElementsByClassName(doc, 'foo');
    testing.assertEquals(result.length, 2);

    child.className = 'foobar';
    var result = domlib.getElementsByClassName(doc, 'foo');
    testing.assertEquals(result.length, 1);
};

function test_compareNodes_simple() {
    var n1 = doc.createElement('foo');
    var n2 = doc.createElement('foo');

    testing.assertTrue(domlib.compareNodes(n1, n2));
};

function test_compareNodes_ns() {
    var n1 = doc.createElementNS('foo:', 'foo');
    var n2 = doc.createElementNS('bar:', 'foo');

    testing.assertFalse(domlib.compareNodes(n1, n2));
};

function test_compareNodes_attrs() {
    var n1 = doc.createElement('foo');
    var n2 = doc.createElement('foo');

    n1.setAttribute('foo', 'bar');
    n2.setAttribute('foo', 'bar');

    testing.assertTrue(domlib.compareNodes(n1, n2));

    n2.setAttribute('foo', 'baz');
    testing.assertFalse(domlib.compareNodes(n1, n2));

    n2.setAttribute('foo', 'bar');
    n1.setAttribute('bar', 'baz');
    testing.assertFalse(domlib.compareNodes(n1, n2));

    n1.removeAttribute('bar');
    testing.assertTrue(domlib.compareNodes(n1, n2));

    n1.setAttributeNS('foo:', 'bar', 'baz');
    n2.setAttributeNS('bar:', 'bar', 'baz');
    testing.assertFalse(domlib.compareNodes(n1, n2));

    n2.removeAttribute('bar');
    n2.setAttributeNS('foo:', 'bar', 'baz');
    testing.assertTrue(domlib.compareNodes(n1, n2));
};

function test_compareNodes_nodeValue() {
    var n1 = doc.createElement('foo');
    var n2 = doc.createElement('foo');
    n1.appendChild(doc.createTextNode('bar'));
    n2.appendChild(doc.createTextNode('baz'));

    testing.assertFalse(domlib.compareNodes(n1, n2));
    
    n2.childNodes[0].nodeValue = 'bar';
    testing.assertTrue(domlib.compareNodes(n1, n2));
};

function test_compareNodes_xmlns() {
    var dom = new dommer.DOM();
    var doc = dom.parseXML('<foo xmlns="bar:"><bar /></foo>');
    var doc2 = dom.parseXML(
        '<b:foo xmlns:b="bar:"><bar xmlns="bar:" /></b:foo>');
    testing.assertTrue(domlib.compareNodes(
        doc.documentElement, doc2.documentElement));
};

function test_compareNodes_more_in_second() {
    var dom = new dommer.DOM();
    var doc1 = dom.parseXML('<foo><bar /></foo>');
    var doc2 = dom.parseXML('<foo><bar /><baz /></foo>');
    testing.assertFalse(domlib.compareNodes(
        doc1.documentElement, doc2.documentElement));
};
