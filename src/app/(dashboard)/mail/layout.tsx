/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */

import { EmailSidebar } from "@/components/mail/email-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <EmailSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris in
          euismod turpis. Nulla ut ex magna. Sed porta, augue non maximus
          bibendum, mauris sem aliquam orci, at vestibulum massa ligula non
          tellus. Phasellus tincidunt tellus eu nulla auctor tristique vel ac
          diam. Curabitur dictum tellus nec ex finibus, ut posuere nunc
          porttitor. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Phasellus euismod mauris quis ante consequat, ut pretium urna
          vestibulum. Nam justo velit, vestibulum vitae sodales sed, hendrerit
          in leo. Nulla volutpat arcu ut lectus viverra, et viverra nisl tempus.
          Phasellus luctus nunc eu aliquam maximus. Mauris sem lectus,
          condimentum quis nulla nec, tempor pretium urna. Sed scelerisque lacus
          quis dictum luctus. Proin a ipsum massa. Integer sodales metus sed
          vestibulum scelerisque. Ut eget pretium ex, non tristique ligula.
          Nullam congue, ipsum non dignissim eleifend, lectus neque dictum nunc,
          non viverra mauris sapien ut ipsum. Donec commodo neque diam, vitae
          ultricies sem egestas sed. Vivamus malesuada ante nisi, sed suscipit
          elit dignissim quis. Duis urna arcu, porttitor et feugiat in,
          pellentesque eu sapien. Donec eu luctus tellus. Suspendisse a
          efficitur augue, eu auctor urna. Vestibulum in congue sapien. Aenean
          vel aliquam nunc. Maecenas at urna non mauris accumsan condimentum.
          Nam maximus ipsum erat, non auctor risus dictum placerat. Nam lectus
          erat, interdum dapibus blandit tincidunt, mollis vitae orci. Fusce ut
          sagittis tellus. Vestibulum ac viverra arcu, at venenatis ligula. Duis
          ut nisi mollis, tincidunt orci ac, congue felis. Praesent vel
          elementum nisl. Sed pretium risus lacus, eget finibus erat tristique
          sed. Pellentesque congue lacus vitae tincidunt auctor. Maecenas at
          purus non urna eleifend scelerisque. Praesent varius facilisis velit
          eget convallis. Proin ligula sapien, placerat vehicula iaculis ac,
          varius eu nulla. Etiam ullamcorper sollicitudin pretium. Nam
          vestibulum neque neque, non auctor leo porttitor quis. Curabitur in
          magna eget turpis cursus malesuada id id odio. Nam et elit sit amet
          turpis venenatis iaculis at in lectus. Proin viverra lorem in nunc
          accumsan, iaculis euismod dolor tincidunt. Maecenas volutpat enim sit
          amet metus mollis, a congue ligula lacinia. Quisque facilisis, ligula
          tristique consequat lobortis, ipsum orci pellentesque sapien, at
          rhoncus tellus purus quis augue. Maecenas ante arcu, viverra in
          consectetur nec, sagittis nec ex. Sed semper dolor aliquam finibus
          dictum. Aliquam erat volutpat. Vestibulum aliquam lobortis commodo.
          Vestibulum vitae pretium arcu. Etiam aliquet, orci vitae porttitor
          auctor, lacus velit sodales neque, non lacinia libero velit vel mi.
          Duis vitae lacus neque. Morbi nec sapien urna. Nulla aliquet varius
          arcu ut pulvinar. Proin sed lacus sodales, accumsan magna vel, commodo
          sem. Mauris malesuada dolor at leo semper luctus. Vestibulum vehicula
          eget sapien sit amet euismod. Quisque non fermentum nulla, et
          vestibulum tellus. Donec vulputate elit quis sapien commodo, sit amet
          viverra mauris pharetra. Proin placerat nunc vel mollis blandit.
          Quisque porttitor mauris id nunc efficitur fermentum. Nullam pharetra
          nulla vel arcu feugiat, eu mollis sapien rhoncus. Maecenas consequat
          tellus in pharetra semper. Curabitur dignissim augue nec dui rhoncus
          imperdiet. Phasellus et egestas urna. Nulla egestas a nisl elementum
          faucibus. Nulla dapibus venenatis enim et ornare. Integer convallis in
          libero sed faucibus. Cras convallis, tellus nec porttitor elementum,
          metus ex vulputate mauris, ac feugiat ipsum risus sit amet tellus. Sed
          semper efficitur orci vel vestibulum. Aenean posuere sapien ligula, a
          suscipit libero molestie vitae. Sed ultricies sollicitudin sem, eget
          finibus sapien condimentum id. Class aptent taciti sociosqu ad litora
          torquent per conubia nostra, per inceptos himenaeos. Vivamus sit amet
          ultrices elit. Vivamus est est, feugiat id odio id, venenatis mollis
          lorem. In hac habitasse platea dictumst. Duis ultricies scelerisque
          velit, vel mattis ante sagittis vitae. Phasellus tincidunt felis non
          elit viverra facilisis. Aliquam massa nunc, porttitor in est at,
          placerat sodales quam. In hac habitasse platea dictumst. Proin ut
          interdum diam, non dapibus nibh. Quisque id tortor a ligula mollis
          volutpat ut quis quam. Sed consequat gravida ex, at finibus neque
          sagittis non. Duis gravida tortor ligula, vitae ornare tortor
          fringilla a. Proin volutpat orci in turpis hendrerit facilisis. In
          justo turpis, suscipit vitae lectus quis, venenatis viverra turpis.
          Vivamus nunc nisi, venenatis id eros id, scelerisque feugiat enim.
          Vivamus molestie nulla vitae enim fringilla, nec molestie lacus
          pharetra. Nam auctor purus eros. Maecenas vitae pellentesque turpis.
          Ut consectetur venenatis neque, sed mollis nisi rhoncus sed. Etiam
          pretium ex sit amet laoreet mattis. Sed sit amet dolor eget velit
          cursus gravida. Curabitur cursus est dolor, eget scelerisque ex
          pharetra quis. Sed sit amet egestas neque, at commodo odio. Maecenas
          at tellus lectus. Aliquam lorem augue, rutrum vel fringilla ac,
          feugiat a enim. Ut eget massa facilisis, dignissim nisi et, malesuada
          ipsum. Aliquam erat volutpat. Aenean nulla leo, consequat vitae tortor
          quis, tristique aliquet sapien. Integer porttitor at mauris at
          porttitor. Nullam varius aliquet nisi at maximus. Pellentesque vel
          facilisis urna. Pellentesque habitant morbi tristique senectus et
          netus et malesuada fames ac turpis egestas. Quisque ultrices ac purus
          vel venenatis. Sed pharetra facilisis magna ut fermentum. Duis
          accumsan nulla sit amet ante porta, et consectetur nisl varius.
          Suspendisse sed mauris sem. Sed quis massa semper ex porttitor
          bibendum et a tellus. Nam varius interdum mauris ac cursus. Vestibulum
          fermentum justo vitae lacus cursus, nec efficitur sapien posuere.
          Proin hendrerit et sapien sit amet finibus. Sed ac erat in justo
          aliquam fringilla a sit amet dolor. Duis bibendum fringilla massa, non
          vehicula ex. Nunc tristique orci ut eleifend lacinia. Maecenas
          volutpat odio non molestie semper. Nullam sit amet dictum nisl. Nulla
          sem felis, mattis a dignissim non, volutpat vitae ligula. Vestibulum
          laoreet mattis enim vel interdum. Sed in euismod turpis. Vivamus sit
          amet vestibulum leo. Sed pellentesque metus ac orci molestie, id
          tempor diam maximus. Maecenas eleifend porta magna, sit amet varius
          ipsum facilisis pretium. In eget quam vitae magna lacinia egestas a id
          arcu. Praesent vehicula nulla vel quam egestas, vel suscipit velit
          mattis. Phasellus vitae fermentum nibh, eu rhoncus purus. Integer
          dapibus volutpat elementum. Curabitur eu ex sed orci iaculis molestie
          et at tortor. Aenean lacinia nunc id ligula tempor suscipit. Ut cursus
          nisi sapien, nec molestie nisi imperdiet ac. Sed tincidunt tortor a
          nulla tempus faucibus nec sit amet ex. Maecenas a varius neque. Donec
          quam nulla, accumsan sit amet molestie id, feugiat quis libero. Proin
          sit amet augue et eros convallis vehicula. Vestibulum tempor est at
          suscipit tempus. Donec interdum et dui sit amet venenatis. Sed ut
          vehicula libero. Nulla nec lectus sed leo accumsan tincidunt eu luctus
          nisi. Ut tristique lacus in mattis pulvinar. Sed pulvinar nunc quis
          elit suscipit, bibendum eleifend sem hendrerit. Sed sit amet velit ac
          neque pretium ultricies. Vestibulum laoreet rutrum urna quis auctor.
          Cras faucibus mi vitae orci facilisis, eu iaculis purus consectetur.
          Nulla tempor erat at posuere viverra. In gravida condimentum dui, ac
          finibus ante consectetur at. Curabitur dui sapien, consectetur at
          sollicitudin vel, sodales eget elit. Nulla sit amet orci lobortis,
          malesuada arcu eget, lacinia ligula. Quisque nec lectus non massa
          interdum fringilla. Nullam tempus ac augue vitae porta. Curabitur
          feugiat et urna non dictum. Duis sit amet libero mattis, dignissim
          diam sed, pulvinar magna. Integer cursus est dolor, ac scelerisque
          quam maximus ut. Suspendisse rutrum gravida nulla eget sollicitudin.
          Sed tempor purus ut ex euismod mollis. Vestibulum sed augue feugiat,
          volutpat nisl vel, scelerisque nibh. Lorem ipsum dolor sit amet,
          consectetur adipiscing elit. Phasellus lacinia dui id auctor molestie.
          Curabitur vel convallis elit. Proin suscipit purus lacus, vel aliquet
          massa laoreet eget. Pellentesque accumsan ut ex ultrices accumsan. Sed
          pulvinar diam nunc, ut iaculis arcu consequat vel. Pellentesque
          volutpat quis nisi et vulputate. Sed consectetur dui vitae placerat
          tristique. Nulla facilisi. Vivamus feugiat egestas odio, sed
          pellentesque lorem commodo quis. Sed volutpat nisl lectus, et
          tincidunt sem bibendum a. Maecenas urna leo, placerat vel elementum
          hendrerit, commodo sed magna. Donec eget ante leo. Proin eu iaculis
          mi, eget vestibulum sapien. Donec cursus sapien massa, sed aliquam
          quam scelerisque non. Sed euismod dui at egestas dapibus. Nulla nec
          consequat odio, in volutpat nisi. Nunc dignissim faucibus risus in
          accumsan. Nulla ante elit, viverra non velit suscipit, auctor ultrices
          diam. Quisque sit amet lectus dignissim odio vulputate elementum at at
          turpis. Nulla non ultrices urna. Mauris vehicula blandit urna, vel
          sagittis odio. Curabitur et finibus erat. Proin fermentum ex id quam
          ultricies viverra. Aliquam id risus quis purus auctor consequat a sit
          amet turpis. Curabitur elementum nibh dui, accumsan finibus dui
          fringilla a. Cras semper sem vel est sagittis tincidunt. Phasellus
          vitae eleifend turpis. Nunc at consectetur dui. Vivamus sollicitudin
          arcu neque, eget egestas quam tristique at. Suspendisse potenti. Morbi
          malesuada non sem non rutrum. Praesent efficitur erat quis pharetra
          tincidunt. Class aptent taciti sociosqu ad litora torquent per conubia
          nostra, per inceptos himenaeos. Nullam suscipit, sapien eget viverra
          vehicula, nibh ipsum tempus felis, sed ultrices nisi felis nec nisi.
          Sed venenatis nulla diam, nec pellentesque dolor vulputate non. Sed
          sit amet felis nec ligula dictum tristique. Phasellus at ligula a
          dolor sagittis aliquam. Etiam libero neque, pulvinar nec mollis
          eleifend, mattis sit amet leo. Nulla sit amet porta arcu. Donec eu
          augue a dolor fringilla imperdiet. Aliquam maximus pellentesque
          auctor. Donec et tellus vehicula, vestibulum eros eu, elementum justo.
          Nunc sollicitudin in enim nec euismod. Aliquam sit amet tristique
          enim, id placerat magna. Aenean vulputate velit nec fringilla posuere.
          Etiam cursus erat ante, nec venenatis augue congue et. Fusce elit
          tortor, blandit quis eros vitae, blandit scelerisque velit. Sed vel
          dignissim purus. Mauris tempus non urna vel luctus. Praesent eget sem
          arcu. Maecenas pharetra arcu vel arcu vulputate, vitae posuere eros
          tempus. Sed rutrum ullamcorper mi eu porta. Nulla aliquam nec lorem et
          efficitur. Nam fermentum nisi at tellus blandit, accumsan ultrices
          tellus mollis. Quisque laoreet augue ante, sit amet sagittis lectus
          consectetur sit amet. Aliquam erat volutpat. Vivamus vulputate
          interdum magna, at fermentum ex volutpat at. Aliquam fermentum
          vehicula dictum. Sed quis libero a risus volutpat blandit. Praesent
          consequat hendrerit felis. Donec a nulla velit. Cras placerat magna
          lectus, nec vestibulum nisi finibus vitae. Duis tincidunt, sapien nec
          commodo rhoncus, arcu eros sollicitudin tellus, quis iaculis lacus dui
          pharetra lectus. In eu est blandit, volutpat arcu vitae, convallis
          turpis. Nulla ex leo, pellentesque imperdiet felis sed, imperdiet
          pulvinar magna. In sit amet elit pellentesque, aliquet massa a, congue
          metus. Sed varius nisi erat, id fermentum felis pulvinar vulputate.
          Sed condimentum dui quis nunc elementum blandit. Vestibulum lacus
          ante, faucibus vitae dictum non, lobortis ac enim. Sed ultrices
          faucibus ex eu elementum. Donec vestibulum arcu vel sagittis pharetra.
          Fusce non lorem turpis. Aliquam egestas in sapien id commodo. Ut vel
          congue mauris. Suspendisse at ligula pharetra, pretium libero sit
          amet, lobortis nisl. Integer hendrerit augue sed leo cursus, ac
          consequat nisl consectetur. Duis scelerisque ante sit amet ante
          scelerisque, non viverra lectus aliquet. Duis et lobortis ante. Donec
          aliquet massa ut bibendum ornare. Fusce bibendum libero risus, a
          euismod arcu accumsan ac. Phasellus lobortis ante orci, vitae placerat
          ligula pharetra vel. Vivamus posuere commodo lectus, ac suscipit
          libero tincidunt ac. Mauris ipsum mauris, tristique sed tempor nec,
          interdum nec ipsum.
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
