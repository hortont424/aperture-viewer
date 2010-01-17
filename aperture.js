alphabeticalSort = false;

toplevelData = null;
allPhotos = null;
choosers = [];

function updateChoosers()
{
    // Calculate and update the width of the choosers
    percentWidth = 100 / choosers.length;
    
    for(var i in choosers)
    {
        choosers[i].width(percentWidth + "%");
    }
}

function getSelectedTags()
{
    selectedTags = [];
    
    for(var i in choosers)
    {
        selectedTags.push(choosers[i].val());
    }
    
    return selectedTags;
}

function setPictureCount(pc)
{
    var pluralizedPix = " pictures";
    
    if(pc == 1)
    {
        pluralizedPix = " picture";
    }
    
    $("#pictureCount").html(pc + pluralizedPix);
}

function createChooser(num, tags)
{
    choosers[num] = $("<select id='chooser' size='15'></select>");
    
    for(var i in tags)
    {
        choosers[num].append("<option>" + tags[i] + "</option>");
    }
    
    choosers[num].change(function()
    {
        selectInChooser(num);
    });
    
    updateChoosers();
    
    $("#choosers").append(choosers[num]);
}

function loadTags(chooser, data)
{
    tagCounts = [];
    tags = [];
    
    // Create a *sortable* array of name/count objects
    $.each(data, function(key, value)
    {
        tagCounts.push({"tag": key, "count": value});
    });
    
    // Sort the names, ascending, by number of tagged images
    if(!alphabeticalSort)
    {
        tagCounts.sort(function(a,b)
        {
            return b.count - a.count;
        });
    }
    
    // Pull the sorted list of names into a simple array
    for(var i in tagCounts)
    {
        tags[i] = tagCounts[i].tag;
    }
    
    // If the user has chosen to do so, sort alphabetically
    if(alphabeticalSort)
    {
        tags.sort();
    }
    
    // Create the chooser with the given tags, inserting it
    // into the page as well
    createChooser(chooser, tags);
    
    return tags;
}

function selectInChooser(num)
{
    // Delay until intersecting tags have been loaded
    if(allPhotos === null)
    {
        window.setTimeout("selectInChooser("+num+")", 100);
    }
    
    // Hide currently-shown images
    $("#images").empty();
    
    // Remove choosers that are invalidated by the change
    badChoosers = choosers.slice(num + 1, choosers.length + 1);
    choosers = choosers.slice(0, num + 1);
    
    for(var i in badChoosers)
    {
        badChoosers[i].remove();
    }
    
    // Get the list of selected tags; we only want to display
    // tags in the next chooser which intersect with all of these
    tagList = getSelectedTags();
    
    var otherTags = {};

    var total = 0;

    // Calculate the intersecting tags
    $.each(allPhotos, 
        function(inkey,invalue)
        {
            var pictureNames = (invalue + "").split(",");
            var ct = 0;
            
            for(var i = 0; i < pictureNames.length; i++)
            {
                if($.inArray(pictureNames[i], tagList) >= 0)
                {
                    if(++ct == tagList.length)
                    {
                        break;
                    }
                }
            }
            
            if(ct == tagList.length)
            {
                for(i = pictureNames.length - 1; i >= 0; --i)
                {
                    if(!otherTags[pictureNames[i]])
                    {
                        otherTags[pictureNames[i]] = 1;
                    }
                    else
                    {
                        otherTags[pictureNames[i]] += 1;
                    }
                }
                ++total;
            }
        }
    );
    
    // Update the count
    setPictureCount(total);
    
    // Pull out the names and create the new chooser!
    names = {};
    hadNames = false;
    
    $.each(otherTags, function(key, value)
    {
        if($.inArray(key, tagList) < 0)
        {
            names[key] = value;
            hadNames = true;
        }
    });
    
    // Don't make a new chooser if there were no subtags!
    if(hadNames)
    {
        loadTags(num + 1, names);
    }
}

function resetSelection()
{
    $("#choosers").empty();
    $("#images").empty();
    
    if(allPhotos)
    {
        setPictureCount($.keys(allPhotos).length);
    }
    
    choosers = [];
    loadTags(0, toplevelData);
}

function loadedSelection()
{
    $("#spin").hide();
    $("a.zoom").fancybox();
    $("li").css("width", $("#slider").slider("value"));
}

function loadSelection()
{
    var tags = getSelectedTags().join(",");
    $("#images").load("ap-tags.cgi?pictureTags=" + tags, 0, loadedSelection);
    $("#spin").show();
}

function adjustImageSize(event, ui)
{
    $("li").css("width", ui.value);
}

function toggleSortMethod()
{
    alphabeticalSort = !alphabeticalSort;
    
    if(alphabeticalSort)
    {
        $("#sortSwitchLabel").html("Photo Count");
    }
    else
    {
        $("#sortSwitchLabel").html("Alphabetical");
    }
    
    resetSelection();
}

function main()
{
    $(function()
    {
        installFancybox();
        
        $.extend({
            keys: function(obj){
                var a = [];
                $.each(obj, function(k){ a.push(k) });
                return a;
            }
        })
        
        $("*").ajaxStart(function()
        {
            $("#spin").show();
        });
        $("*").ajaxStop(function()
        {
            $("#spin").hide();
        });
        
        $.getJSON("ap-tags.cgi?pictures=1", function(d)
        {
            allPhotos = d;
            setPictureCount($.keys(allPhotos).length);
        });
        $.getJSON("ap-tags.cgi?tags=1", function(d)
        {
            toplevelData = d;
            resetSelection();
        });
        $("#slider").slider(
        {
            min: 16,
            max: 400,
            value: 200,
            slide: adjustImageSize
        });
    });
}

google.load("jquery", "1");
google.load("jqueryui", "1");
google.setOnLoadCallback(main);