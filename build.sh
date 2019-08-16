!/bin/bash
SRCDIR=$1
if [ -f "$SRCDIR/omni.ja" ] && [ -f "$SRCDIR"/browser/omni.ja ]; then
        # Unzip with overwrite (-o) and quietly (-q) and into destination omni/
        unzip -o -q "$SRCDIR"/omni.ja -d omni/

        # Unzip with overwrite (-o) and quietly (-q) and into destination browser/omni/
        unzip -o -q "$SRCDIR"/browser/omni.ja -d browser/omni/
        BUILDID=$(grep -E -o '[0-9]{14}' "$SRCDIR"/platform.ini)

        read -r -p "Create commit for updated files? [Y/n]" answer
        case $answer in
           [nN]* ) echo "To create the commit yourself use "
                   echo "git add *; git commit -m \"Updated to build id $BUILDID\""
                   exit;;

           * )     git add -- *; git commit -m "Updated to build id $BUILDID"
                   echo "Okay, ready to push to repo"
                   ;;

       esac

else
        echo No omni.ja files found in "$SRCDIR"
fi

